import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { once } from 'node:events';
import net from 'node:net';
import express from 'express';
import mongoose from 'mongoose';
import Customer from '../model/secondaryUser/customerSchema.js';
import License from '../model/secondaryUser/licenseSchema.js';
import CallNote from '../model/secondaryUser/callNotesSchema.js';
import CallRegistration from '../model/secondaryUser/CallRegistrationSchema.js';
import Branch from '../model/primaryUser/branchSchema.js';
import { ComplaintVerification, ComplaintRateLimit } from '../model/websiteComplaintVerification.js';
import { createWebsiteComplaintController } from '../controller/websiteComplaintController.js';
import { complaintServiceAuth } from '../routes/websiteComplaintRoutes.js';

let mongo, directory, server, base, customer, note, messages, failMail;
const key = 'isolated-test-key-never-used-in-production-12345';
const oid = () => new mongoose.Types.ObjectId();
before(async () => {
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  directory = await mkdtemp(join(tmpdir(), 'crm-complaint-test-'));
  mongo = spawn(process.env.MONGOD_BINARY || 'mongod', ['--dbpath', directory, '--port', String(port), '--bind_ip', '127.0.0.1', '--quiet'], { windowsHide: true, stdio: 'ignore' });
  let spawnError;
  mongo.on('error', error => { spawnError = error; });
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (spawnError) throw spawnError;
    try { await mongoose.connect(`mongodb://127.0.0.1:${port}/complaint_test`, { serverSelectionTimeoutMS: 300 }); ready = true; break; }
    catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  assert.ok(ready, 'Isolated MongoDB did not start');
  await Promise.all([ComplaintVerification.init(), ComplaintRateLimit.init()]);
  process.env.CAMET_COMPLAINT_API_KEY = key;
  process.env.COMPLAINT_BRANCH_NAME = 'CAMET';
  process.env.COMPLAINT_NOTIFY_EMAIL = 'camet@example.test';
  const app = express(); app.use(express.json(), complaintServiceAuth);
  const controller = createWebsiteComplaintController({ mail: async mail => { if (failMail) throw new Error('Test SMTP unavailable'); messages.push(mail); } });
  app.post('/check-license', controller.checkLicense);
  app.post('/send-otp', controller.sendOtp);
  app.post('/verify-otp', controller.verifyOtp);
  app.post('/submit', controller.submitComplaint);
  server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo?.pid && mongo.exitCode === null) { const ended = once(mongo, 'exit'); mongo.kill(); await ended; }
  if (directory) { assert.equal(dirname(resolve(directory)), resolve(tmpdir())); assert.ok(basename(directory).startsWith('crm-complaint-test-')); await rm(directory, { recursive: true, force: true }); }
});
beforeEach(async () => {
  await Promise.all([Customer, License, CallNote, CallRegistration, Branch, ComplaintVerification, ComplaintRateLimit].map(model => model.deleteMany({})));
  messages = []; failMail = false;
  customer = await Customer.create({ customerName: 'Example Customer', email: 'registered@example.test', mobile: '9876543210', selected: [{ licensenumber: 123456789 }] });
  note = await CallNote.create({ callNotes: 'Software issue' });
  await Branch.create({ branchName: 'CAMET', companyName: oid() });
});
async function post(path, body, auth = key) {
  const result = await fetch(`${base}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Camet-Complaint-Key': auth }, body: JSON.stringify(body) });
  return { status: result.status, data: await result.json() };
}
async function access() {
  const sent = await post('send-otp', { licenceNumber: '123456789' });
  assert.equal(sent.status, 200);
  const otp = messages.at(-1).text.match(/\b\d{6}\b/)[0];
  const verified = await post('verify-otp', { challengeId: sent.data.challengeId, otp });
  assert.equal(verified.status, 200);
  return { challengeId: sent.data.challengeId, verificationToken: verified.data.verificationToken };
}
const details = () => ({ contactNumber: '9876543210', callNoteId: note._id.toString(), description: 'Application is not opening today.' });

test('service authentication, missing customers, malformed licences, and no pre-verification details', async () => {
  assert.equal((await post('check-license', { licenceNumber: '123456789' }, 'wrong')).status, 401);
  assert.equal((await post('check-license', { licenceNumber: { $ne: null } })).status, 400);
  assert.equal((await post('check-license', { licenceNumber: '999' })).status, 404);
  const result = await post('check-license', { licenceNumber: '123456789' });
  assert.equal(result.data.exists, true);
  assert.equal(result.data.email, undefined); assert.equal(result.data.contactNumber, undefined);
  assert.equal((await post('submit', details())).status, 401);
});
test('OTP goes only to registered email; verification unlocks contact and CRM notes', async () => {
  const sent = await post('send-otp', { licenceNumber: '123456789', email: 'attacker@example.test' });
  assert.equal(messages[0].to, 'registered@example.test');
  assert.equal(sent.data.maskedEmail, 'r***@example.test'); assert.equal(sent.data.otp, undefined);
  const otp = messages[0].text.match(/\b\d{6}\b/)[0];
  const result = await post('verify-otp', { challengeId: sent.data.challengeId, otp });
  assert.equal(result.data.contactNumber, '9876543210');
  assert.equal(result.data.callNotes[0].callNotes, 'Software issue');
  assert.equal((await post('verify-otp', { challengeId: sent.data.challengeId, otp })).status, 400);
});
test('OTP expiry, five-attempt limit, resend throttle and unregistered email are enforced', async () => {
  const sent = await post('send-otp', { licenceNumber: '123456789' });
  const otp = messages[0].text.match(/\b\d{6}\b/)[0];
  assert.equal((await post('send-otp', { licenceNumber: '123456789' })).status, 429);
  for (let i = 0; i < 5; i++) assert.equal((await post('verify-otp', { challengeId: sent.data.challengeId, otp: '000000' })).status, 400);
  assert.equal((await post('verify-otp', { challengeId: sent.data.challengeId, otp })).status, 400);
  await ComplaintVerification.updateOne({ challengeId: sent.data.challengeId }, { $set: { attempts: 0, otpExpiresAt: new Date(0) } });
  assert.equal((await post('verify-otp', { challengeId: sent.data.challengeId, otp })).status, 400);
  await Customer.updateOne({ _id: customer._id }, { $set: { email: '' } });
  assert.equal((await post('send-otp', { licenceNumber: '123456789' })).status, 422);
});
test('saves one pending product-free call, links history, and sends Camet notification', async () => {
  const auth = await access();
  const body = { ...auth, ...details(), product: oid(), status: 'solved', customerid: oid() };
  const results = await Promise.all([post('submit', body), post('submit', body)]);
  assert.ok(results.every(result => result.data.success));
  const saved = await CallRegistration.findOne({ customerid: customer._id }).lean();
  assert.equal(await CallRegistration.countDocuments(), 1);
  assert.equal(saved.callregistration.length, 1);
  const call = saved.callregistration[0];
  assert.equal(call.product, undefined); assert.equal(call.formdata.status, 'pending');
  assert.deepEqual(call.branchName, ['CAMET']); assert.deepEqual(call.formdata.attendedBy, []);
  assert.equal(call.formdata.callnote.toString(), note._id.toString());
  assert.equal((await Customer.findById(customer._id)).callregistration.toString(), saved._id.toString());
  const notifications = messages.filter(mail => mail.to === 'camet@example.test');
  assert.equal(notifications.length, 1); assert.match(notifications[0].text, /Example Customer/);
  assert.equal((await post('submit', body)).data.notificationSent, true);
});
test('appends to existing call history without changing staff call entries', async () => {
  const existing = await CallRegistration.create({ customerid: customer._id, customerName: 'Example Customer', callregistration: [{ product: oid(), branchName: ['CAMET'], formdata: { status: 'solved', description: 'Existing staff call' } }] });
  const auth = await access();
  await post('submit', { ...auth, ...details() });
  const saved = await CallRegistration.findById(existing._id).lean();
  assert.equal(saved.callregistration.length, 2);
  assert.equal(saved.callregistration[0].formdata.description, 'Existing staff call');
  assert.equal(saved.callregistration[0].formdata.status, 'solved');
});
test('expired verification and invalid notes cannot submit', async () => {
  const auth = await access();
  assert.equal((await post('submit', { ...auth, ...details(), callNoteId: oid().toString() })).status, 400);
  await ComplaintVerification.updateOne({ challengeId: auth.challengeId }, { $set: { verifiedUntil: new Date(0) } });
  assert.equal((await post('submit', { ...auth, ...details() })).status, 401);
  assert.equal(await CallRegistration.countDocuments(), 0);
});
test('notification failure preserves saved complaint; retry sends email without duplicate', async () => {
  const auth = await access(); failMail = true;
  const first = await post('submit', { ...auth, ...details() });
  assert.equal(first.data.success, true); assert.equal(first.data.notificationSent, false);
  failMail = false;
  const retry = await post('submit', { ...auth, ...details(), description: 'This must not replace the saved complaint' });
  assert.equal(retry.data.notificationSent, true); assert.equal(retry.data.reference, first.data.reference);
  const saved = await CallRegistration.findOne({ customerid: customer._id }).lean();
  assert.equal(saved.callregistration.length, 1); assert.match(saved.callregistration[0].formdata.description, /Application is not opening/);
});
test('licence index and tagged customer licences are supported', async () => {
  await Customer.updateOne({ _id: customer._id }, { $set: { selected: [{ taggeddata: [{ licensenumber: 555 }] }] } });
  assert.equal((await post('check-license', { licenceNumber: '555' })).data.exists, true);
  await License.create({ customerName: customer._id, licensenumber: 777 });
  assert.equal((await post('check-license', { licenceNumber: '777' })).data.exists, true);
});
