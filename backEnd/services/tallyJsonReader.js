import { StringDecoder } from "node:string_decoder"

// Extract one top-level object at a time without buffering a whole JSON array.
// JSON.parse validates each complete object; the state machine validates the
// enclosing array, separators, trailing data and truncated input.
export function createTallyJsonReader(accept, maxRecordBytes = 16384) {
  const decoder = new StringDecoder("utf8")
  let state = "start", array = false, text = "", stack = [], quoted = false, escaped = false, count = 0
  const invalid = message => { throw Object.assign(new Error(message), { status: 422 }) }
  const feed = async input => {
    for (const char of input) {
      if (state === "record") {
        text += char
        if (text.length > maxRecordBytes) throw Object.assign(new Error("A customer record exceeds 16 KiB."), { status: 413 })
        if (quoted) {
          if (escaped) escaped = false
          else if (char === "\\") escaped = true
          else if (char === '"') quoted = false
        } else if (char === '"') quoted = true
        else if (char === "{" || char === "[") stack.push(char)
        else if (char === "}" || char === "]") {
          if (stack.pop() !== (char === "}" ? "{" : "[")) invalid("Malformed JSON brackets.")
          if (!stack.length) {
            if (Buffer.byteLength(text, "utf8") > maxRecordBytes) throw Object.assign(new Error("A customer record exceeds 16 KiB."), { status: 413 })
            let value
            try { value = JSON.parse(text) } catch { invalid(`Record ${count + 1}: invalid JSON.`) }
            await accept(value, ++count)
            text = ""
            state = array ? "separator" : "done"
          }
        }
        continue
      }
      if (/\s/.test(char)) {
        if (!" \t\r\n".includes(char)) invalid("Invalid JSON whitespace.")
        continue
      }
      if (state === "start" && char === "[") { array = true; state = "first"; continue }
      if ((state === "first" || state === "separator") && char === "]") { state = "done"; continue }
      if (state === "separator" && char === ",") { state = "next"; continue }
      if (["start", "first", "next"].includes(state) && char === "{") {
        text = "{"; stack = ["{"]; quoted = false; escaped = false; state = "record"; continue
      }
      invalid("Expected a customer JSON object or an array of customer objects.")
    }
  }
  return {
    write: async chunk => feed(decoder.write(chunk)),
    end: async () => {
      await feed(decoder.end())
      if (state !== "done") invalid("Incomplete JSON upload.")
    },
  }
}
