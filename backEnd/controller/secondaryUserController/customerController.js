import Customer from "../../model/secondaryUser/customerSchema.js"
import Leavemaster from "../../model/secondaryUser/leavemasterSchema.js"
import { generateUniqueNumericToken } from "../../helper/callTokenGeneration.js"
import { sendWhatapp } from "../../helper/whatapp.js"
import moment from "moment" // You can use moment.js to handle date manipulation easily
import { escapeRegExp } from "../../helper/escapeRegExp.js"
import License from "../../model/secondaryUser/licenseSchema.js"
import CallRegistration from "../../model/secondaryUser/CallRegistrationSchema.js"
import Partner from "../../model/secondaryUser/partnerSchema.js"
import Service from "../../model/primaryUser/servicesSchema.js"
import CallNote from "../../model/secondaryUser/callNotesSchema.js"
import models from "../../model/auth/authSchema.js"
import { sendEmail } from "../../helper/nodemailer.js"
const { Staff, Admin } = models
import mongoose, { isValidObjectId } from "mongoose"
import Product from "../../model/primaryUser/productSchema.js"
import Holymaster from "../../model/secondaryUser/holydaymasterSchema.js"
import LeadMaster from "../../model/primaryUser/leadmasterSchema.js"
export const duplicate = async (req, res) => {

  const duplicateCustomers = await Customer.aggregate([
    {
      $group: {
        _id: "$customerName",
        count: { $sum: 1 }
      }
    },
    {
      $match: {
        _id: { $ne: null },
        count: { $gt: 1 }
      }
    },
    {
      $sort: {
        count: -1
      }
    }
  ]);

  return res.status(200).json({ message: "found duplicate", data: duplicateCustomers })
}

export const GetscrollCustomer = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      search = "",
      loggeduserBranches,
      customerType = "Allcustomers",
      productfilter = "All"
    } = req.query;

    if (!loggeduserBranches) {
      return res.status(400).json({
        message: "loggeduserBranches (branch id) is required"
      });
    }

    const branchId = new mongoose.Types.ObjectId(loggeduserBranches);
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * pageSize;
    const hasProductFilter =
      productfilter &&
      productfilter !== "All" &&
      mongoose.Types.ObjectId.isValid(productfilter)

    const productId = hasProductFilter
      ? new mongoose.Types.ObjectId(productfilter)
      : null
    console.log("productid", productId)
    let baseMatch = {};

    if (customerType === "ProductMissing") {
      baseMatch = {
        $or: [{ selected: { $exists: false } }, { selected: { $size: 0 } }]
      };
    } else if (customerType === "ProductinfoMissing") {
      baseMatch = {
        "selected.branch_id": branchId,
        selected: {
          $elemMatch: {
            branch_id: branchId,
            $or: [{ product_id: null }, { product_id: { $exists: false } }]
          }
        }
      };
    } else {
      baseMatch = {
        "selected.branch_id": branchId,
        selected: { $exists: true, $ne: [] }
      };

      if (customerType !== "Allcustomers") {
        baseMatch.isActive = customerType;
      }
      if (hasProductFilter) {
        baseMatch["selected.product_id"] = productId
      }
    }

    let match = baseMatch;
    const hasSearch = search && search.trim().length > 0;

    if (hasSearch) {
      const safe = search.trim();
      const regex = new RegExp(escapeRegExp(safe), "i");

      const searchConditions = [
        { customerName: { $regex: regex } },
        { mobile: { $regex: regex } }
      ];

      const searchNumber = Number(safe);

      if (!Number.isNaN(searchNumber) && safe !== "") {
        searchConditions.push({
          "selected.licensenumber": searchNumber
        });
      }

      match = {
        $and: [
          baseMatch,
          {
            $or: searchConditions
          }
        ]
      };
    }
    const selectedFilterCondition = hasProductFilter
      ? {
        $and: [
          { $eq: ["$$sel.branch_id", branchId] },
          { $eq: ["$$sel.product_id", productId] }
        ]
      }
      : {
        $eq: ["$$sel.branch_id", branchId]
      }

    const pipeline = [
      { $match: match },

      {
        $facet: {
          metadata: [
            ...(customerType !== "ProductMissing"
              ? [
                {
                  $addFields: {
                    selected: {
                      $filter: {
                        input: "$selected",
                        as: "sel",
                        cond: selectedFilterCondition
                      }
                    }
                  }
                },
                {
                  $match: {
                    selected: { $exists: true, $ne: [] }
                  }
                },
                {
                  $unwind: {
                    path: "$selected",
                    preserveNullAndEmptyArrays: true
                  }
                },
                {
                  $group: {
                    _id: "$_id"
                  }
                }
              ]
              : []),
            {
              $count: "selectedbranchCustomercount"
            }
          ],

          customers: [
            ...(customerType !== "ProductMissing"
              ? [
                {
                  $addFields: {
                    selected: {
                      $filter: {
                        input: "$selected",
                        as: "sel",
                        cond: selectedFilterCondition
                      }
                    }
                  }
                },
                {
                  $match: {
                    selected: { $exists: true, $ne: [] }
                  }
                },
                {
                  $unwind: {
                    path: "$selected",
                    preserveNullAndEmptyArrays: true
                  }
                },

                {
                  $lookup: {
                    from: "products",
                    localField: "selected.product_id",
                    foreignField: "_id",
                    as: "productDetails"
                  }
                },
                {
                  $unwind: {
                    path: "$productDetails",
                    preserveNullAndEmptyArrays: true
                  }
                },

                {
                  $lookup: {
                    from: "branches",
                    localField: "selected.branch_id",
                    foreignField: "_id",
                    as: "branchDetails"
                  }
                },
                {
                  $unwind: {
                    path: "$branchDetails",
                    preserveNullAndEmptyArrays: true
                  }
                },

                {
                  $lookup: {
                    from: "companies",
                    localField: "selected.company_id",
                    foreignField: "_id",
                    as: "companyDetails"
                  }
                },
                {
                  $unwind: {
                    path: "$companyDetails",
                    preserveNullAndEmptyArrays: true
                  }
                },

                {
                  $addFields: {
                    "selected.product_id": {
                      $cond: [
                        { $ifNull: ["$productDetails._id", false] },
                        {
                          _id: "$productDetails._id",
                          productName: "$productDetails.productName",
                          productorservicetype:
                            "$productDetails.productorservicetype"
                        },
                        null
                      ]
                    },
                    "selected.productName": {
                      $ifNull: ["$productDetails.productName", null]
                    },
                    "selected.productorservicetype": {
                      $ifNull: ["$productDetails.productorservicetype", null]
                    },
                    "selected.branch_id": {
                      $cond: [
                        { $ifNull: ["$branchDetails._id", false] },
                        {
                          _id: "$branchDetails._id",
                          branchName: "$branchDetails.branchName"
                        },
                        null
                      ]
                    },
                    "selected.company_id": {
                      $cond: [
                        { $ifNull: ["$companyDetails._id", false] },
                        {
                          _id: "$companyDetails._id",
                          companyName: "$companyDetails.companyName"
                        },
                        null
                      ]
                    }
                  }
                },

                {
                  $group: {
                    _id: "$_id",
                    customerName: { $first: "$customerName" },
                    address1: { $first: "$address1" },
                    address2: { $first: "$address2" },
                    country: { $first: "$country" },
                    city: { $first: "$city" },
                    pincode: { $first: "$pincode" },
                    contactPerson: { $first: "$contactPerson" },
                    landline: { $first: "$landline" },
                    industry: { $first: "$industry" },
                    partner: { $first: "$partner" },
                    state: { $first: "$state" },
                    registrationType: { $first: "$registrationType" },
                    gstNo: { $first: "$gstNo" },
                    email: { $first: "$email" },
                    mobile: { $first: "$mobile" },
                    selected: {
                      $push: "$selected"
                    }
                  }
                }
              ]
              : [
                {
                  $project: {
                    customerName: 1,
                    address1: 1,
                    address2: 1,
                    country: 1,
                    city: 1,
                    pincode: 1,
                    contactPerson: 1,
                    landline: 1,
                    industry: 1,
                    partner: 1,
                    state: 1,
                    registrationType: 1,
                    gstNo: 1,
                    email: 1,
                    mobile: 1
                  }
                }
              ]),

            { $sort: { customerName: 1 } },
            { $skip: skip },
            { $limit: pageSize }
          ]
        }
      },

      {
        $project: {
          selectedbranchCustomercount: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$metadata.selectedbranchCustomercount",
                  0
                ]
              },
              0
            ]
          },
          customers: "$customers"
        }
      }
    ]
    // const pipeline = [
    //   { $match: match },

    //   {
    //     $facet: {
    //       metadata: [
    //         ...(customerType !== "ProductMissing"
    //           ? [
    //             {
    //               $addFields: {
    //                 selected: {
    //                   $filter: {
    //                     input: "$selected",
    //                     as: "sel",
    //                     cond: {
    //                       $eq: ["$$sel.branch_id", branchId]
    //                     }
    //                   }
    //                 }
    //               }
    //             },
    //             {
    //               $unwind: {
    //                 path: "$selected",
    //                 preserveNullAndEmptyArrays: true
    //               }
    //             },
    //             {
    //               $group: {
    //                 _id: "$_id"
    //               }
    //             }
    //           ]
    //           : []),
    //         {
    //           $count: "selectedbranchCustomercount"
    //         }
    //       ],

    //       customers: [
    //         ...(customerType !== "ProductMissing"
    //           ? [
    //             {
    //               $addFields: {
    //                 selected: {
    //                   $filter: {
    //                     input: "$selected",
    //                     as: "sel",
    //                     cond: {
    //                       $eq: ["$$sel.branch_id", branchId]
    //                     }
    //                   }
    //                 }
    //               }
    //             },
    //             {
    //               $unwind: {
    //                 path: "$selected",
    //                 preserveNullAndEmptyArrays: true
    //               }
    //             },

    //             {
    //               $lookup: {
    //                 from: "products",
    //                 localField: "selected.product_id",
    //                 foreignField: "_id",
    //                 as: "productDetails"
    //               }
    //             },
    //             {
    //               $unwind: {
    //                 path: "$productDetails",
    //                 preserveNullAndEmptyArrays: true
    //               }
    //             },

    //             {
    //               $lookup: {
    //                 from: "branches",
    //                 localField: "selected.branch_id",
    //                 foreignField: "_id",
    //                 as: "branchDetails"
    //               }
    //             },
    //             {
    //               $unwind: {
    //                 path: "$branchDetails",
    //                 preserveNullAndEmptyArrays: true
    //               }
    //             },

    //             {
    //               $lookup: {
    //                 from: "companies",
    //                 localField: "selected.company_id",
    //                 foreignField: "_id",
    //                 as: "companyDetails"
    //               }
    //             },
    //             {
    //               $unwind: {
    //                 path: "$companyDetails",
    //                 preserveNullAndEmptyArrays: true
    //               }
    //             },

    //             {
    //               $addFields: {
    //                 "selected.productName": {
    //                   $ifNull: ["$productDetails.productName", null]
    //                 },
    //                 "selected.branch_id": {
    //                   $cond: [
    //                     { $ifNull: ["$branchDetails._id", false] },
    //                     {
    //                       _id: "$branchDetails._id",
    //                       branchName: "$branchDetails.branchName"
    //                     },
    //                     null
    //                   ]
    //                 },
    //                 "selected.company_id": {
    //                   $cond: [
    //                     { $ifNull: ["$companyDetails._id", false] },
    //                     {
    //                       _id: "$companyDetails._id",
    //                       companyName: "$companyDetails.companyName"
    //                     },
    //                     null
    //                   ]
    //                 }
    //               }
    //             },

    //             {
    //               $group: {
    //                 _id: "$_id",
    //                 customerName: { $first: "$customerName" },
    //                 address1: { $first: "$address1" },
    //                 address2: { $first: "$address2" },
    //                 country: { $first: "$country" },
    //                 city: { $first: "$city" },
    //                 pincode: { $first: "$pincode" },
    //                 contactPerson: { $first: "$contactPerson" },
    //                 landline: { $first: "$landline" },
    //                 industry: { $first: "$industry" },
    //                 partner: { $first: "$partner" },
    //                 state: { $first: "$state" },
    //                 registrationType: { $first: "$registrationType" },
    //                 gstNo: { $first: "$gstNo" },
    //                 email: { $first: "$email" },
    //                 mobile: { $first: "$mobile" },
    //                 selected: {
    //                   $push: "$selected"
    //                 }
    //               }
    //             }
    //           ]
    //           : [
    //             {
    //               $project: {
    //                 customerName: 1,
    //                 address1: 1,
    //                 address2: 1,
    //                 country: 1,
    //                 city: 1,
    //                 pincode: 1,
    //                 contactPerson: 1,
    //                 landline: 1,
    //                 industry: 1,
    //                 partner: 1,
    //                 state: 1,
    //                 registrationType: 1,
    //                 gstNo: 1,
    //                 email: 1,
    //                 mobile: 1
    //               }
    //             }
    //           ]),

    //         { $sort: { customerName: 1 } },
    //         { $skip: skip },
    //         { $limit: pageSize }
    //       ]
    //     }
    //   },

    //   {
    //     $project: {
    //       selectedbranchCustomercount: {
    //         $ifNull: [
    //           {
    //             $arrayElemAt: [
    //               "$metadata.selectedbranchCustomercount",
    //               0
    //             ]
    //           },
    //           0
    //         ]
    //       },
    //       customers: "$customers"
    //     }
    //   }
    // ];

    const result = await Customer.aggregate(pipeline);
    const responseData = result[0] || {
      selectedbranchCustomercount: 0,
      customers: []
    };

    return res.status(200).json({
      message: responseData.customers.length
        ? "Customer(s) found"
        : "No customer found",
      data: responseData
    });
  } catch (error) {
    console.error("GetscrollCustomer error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};





export const GetallCallnotes = async (req, res) => {
  try {
    const callnotes = await CallNote.find({})

    if (callnotes) {
      return res.status(200).json({
        message: "callnotes found",
        data: callnotes
      })
    }
  } catch (error) {
    console.log("error:", error.message)
  }
}
export const GetallPartners = async (req, res) => {
  try {
    console.log("ffffffffffffffffff")
    const partners = await Partner.find({}).populate({
      path: 'relationBranches.companyName',
      select: 'companyName' // Only populate these fields
    }).populate({ path: 'relationBranches.branchName', select: 'branchName' })

    if (partners) {
      return res
        .status(200)
        .json({ message: "callnotes found", data: partners })
    }
  } catch (error) {
    console.log("error:", error.message)
  }
}

export const GetPartnerCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ isPartner: true })
      .select("customerName")
      .sort({ customerName: 1 })
      .lean()

    return res.status(200).json({
      message: "Partner customers found",
      data: customers
    })
  } catch (error) {
    console.log("error:", error.message)
    return res.status(500).json({ message: "Internal server error" })
  }
}
export const GetallServices = async (req, res) => {
  try {
    const services = await Service.find({})
    if (services) {
      return res.status(200).json({ message: "Services found", data: services })
    }
  } catch (error) {
    console.log("error:", error.message)
    return res.status(500).json({ message: "Internal server error" })
  }
}
export const DeleteCallnotes = async (req, res) => {
  const { id } = req.query

  const objectId = new mongoose.Types.ObjectId(id)

  try {
    // Perform the deletion
    const result = await CallNote.findByIdAndDelete(objectId)

    if (result) {
      return res.status(200).json({ message: " deleted successfully" })
    } else {
      return res.status(404).json({ message: "callnote not found" })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Server error" })
  }
}
export const DeletePartner = async (req, res) => {
  const { id } = req.query

  const objectId = new mongoose.Types.ObjectId(id)

  try {
    // Perform the deletion
    const result = await Partner.findByIdAndDelete(objectId)

    if (result) {
      return res.status(200).json({ message: " deleted successfully" })
    } else {
      return res.status(404).json({ message: "partner not found" })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Server error" })
  }
}
export const DeletepartnerBranch = async (req, res) => {
  try {
    const { branchId, docId } = req.query
    const objectId = new mongoose.Types.ObjectId(docId)
    const branchObjectId = new mongoose.Types.ObjectId(branchId)
    const result = await Partner.findByIdAndUpdate(objectId, {
      $pull: {
        relationBranches: { branchName: branchObjectId }
      }
    })
    if (result) {
      const allpartners = await Partner.find({}).populate({
        path: 'relationBranches.companyName',
        select: 'companyName' // Only populate these fields
      }).populate({ path: 'relationBranches.branchName', select: 'branchName' })
      return res.status(201).json({ message: "Delete successfully", data: allpartners })
    }

  } catch (error) {
    console.log("error:", error.message)
    return res.status(500).json({ message: "Internal server error" })
  }
}
export const DeleteService = async (req, res) => {
  const { id } = req.query

  const objectId = new mongoose.Types.ObjectId(id)

  try {
    // Perform the deletion
    const result = await Service.findByIdAndDelete(objectId)

    if (result) {
      return res.status(200).json({ message: " deleted successfully" })
    } else {
      return res.status(404).json({ message: "partner not found" })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const UpdateCallnotes = async (req, res) => {
  const { id } = req.query

  const objectId = new mongoose.Types.ObjectId(id)
  const formData = req.body
  if (!id) {
    return res.status(400).json({ message: "Invalid id" })
  }

  try {
    const updatedCallnotes = await CallNote.findByIdAndUpdate(
      objectId,
      formData,
      {
        new: true
      }
    )

    if (!updatedCallnotes) {
      return res.status(404).json({ message: "callnotes not found" })
    }

    res.status(200).json({ data: updatedCallnotes })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Internal Server Error" })
  }
}

export const UpdatePartners = async (req, res) => {
  const { id } = req.query

  const objectId = new mongoose.Types.ObjectId(id)
  const formData = req.body
  if (!id) {
    return res.status(400).json({ message: "Invalid id" })
  }

  try {
    const transformedData = {
      partner: formData.partnerName,
      relationBranches: formData.branchName.map(branchId => ({
        companyName: formData.companyName,
        branchName: branchId
      }))
    }
    const updatedPartners = await Partner.findByIdAndUpdate(
      objectId,
      transformedData,
      {
        new: true,

        runValidators: true

      }
    )
    if (!updatedPartners) {
      return res.status(404).json({ message: "partners not found" })
    }

    res.status(200).json({ data: updatedPartners })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Internal Server Error" })
  }
}
export const UpdateServices = async (req, res) => {
  const { id } = req.query

  const objectId = new mongoose.Types.ObjectId(id)
  const formData = req.body
  if (!id) {
    return res.status(400).json({ message: "Invalid id" })
  }

  try {
    const updatedService = await Service.findByIdAndUpdate(objectId, formData, {
      new: true
    })

    if (!updatedService) {
      return res.status(404).json({ message: "service not found" })
    }

    res.status(200).json({ data: updatedService })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Internal Server Error" })
  }
}
export const GetselectedDateCalls = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100)
    const skip = (page - 1) * limit

    const start = new Date(startDate);

    start.setHours(0, 0, 0, 0); // Start of the day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of the day

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return res.status(400).json({ message: "A valid start and end date are required" })
    }


    // const customerCalls = await CallRegistration.aggregate([

    //   {
    //     $match: {
    //       "callregistration": { $exists: true, $ne: [] },
    //       "callregistration.formdata.attendedBy": { $type: "array" }
    //     }
    //   }
    //   ,


    //   {
    //     $addFields: {
    //       callregistration: {
    //         $filter: {
    //           input: "$callregistration",
    //           as: "call",
    //           cond: {
    //             $gt: [
    //               {
    //                 $size: {
    //                   $filter: {
    //                     input: {
    //                       $ifNull: ["$$call.formdata.attendedBy", []]
    //                     },
    //                     as: "attendee",
    //                     cond: {
    //                       $and: [
    //                         { $ne: ["$$attendee.calldate", null] },
    //                         { $ne: ["$$attendee.calldate", ""] },
    //                         { $in: [{ $type: "$$attendee.calldate" }, ["string", "date"]] },
    //                         {
    //                           $gte: [
    //                             { $toDate: "$$attendee.calldate" },
    //                             start
    //                           ]
    //                         },
    //                         {
    //                           $lte: [
    //                             { $toDate: "$$attendee.calldate" },
    //                             end
    //                           ]
    //                         }
    //                       ]
    //                     }
    //                   }
    //                 }
    //               },
    //               0
    //             ]
    //           }
    //         }
    //       }
    //     }
    //   }

    //   ,
    //   {
    //     $match: {
    //       // Ensure callregistration array still contains at least one element after filtering
    //       callregistration: { $ne: [] }
    //     }
    //   },

    //   // Lookup for product details (and directly enrich the existing product field)
    //   {
    //     $lookup: {
    //       from: "products",
    //       localField: "callregistration.product",
    //       foreignField: "_id",
    //       as: "productDetails" // We temporarily store product details here
    //     }
    //   },

    //   // Lookup for attendedBy details (and directly enrich the existing attendedBy field)
    //   {
    //     $lookup: {
    //       from: "staffs",
    //       localField: "callregistration.formdata.attendedBy.callerId",
    //       foreignField: "_id",
    //       as: "attendedByDetails" // Temporary storage for attendedBy details
    //     }
    //   },

    //   // Lookup for completedBy details (and directly enrich the existing completedBy field)
    //   {
    //     $lookup: {
    //       from: "staffs",
    //       localField: "callregistration.formdata.completedBy.callerId",
    //       foreignField: "_id",
    //       as: "completedByDetails" // Temporary storage for completedBy details
    //     }
    //   },
    //   {
    //     $addFields: {
    //       // Map callregistration to include matched product details
    //       callregistration: {
    //         $map: {
    //           input: "$callregistration", // Iterate over callregistration array
    //           as: "registration",
    //           in: {
    //             $mergeObjects: [
    //               "$$registration", // Preserve existing callregistration fields
    //               {
    //                 productdetails: {
    //                   $arrayElemAt: [
    //                     {
    //                       $filter: {
    //                         input: "$productDetails", // Filter joined products
    //                         as: "product",
    //                         cond: {
    //                           $eq: ["$$product._id", "$$registration.product"] // Match product ID
    //                         }
    //                       }
    //                     },
    //                     0
    //                   ]
    //                 }
    //               }
    //             ]
    //           }
    //         }
    //       }
    //     }
    //   },
    //   {
    //     $addFields: {
    //       // Map callregistration to include attendedBy details
    //       callregistration: {
    //         $map: {
    //           input: "$callregistration", // Iterate over callregistration array
    //           as: "registration",
    //           in: {
    //             $mergeObjects: [
    //               "$$registration", // Preserve existing callregistration fields
    //               {
    //                 attendeddetails: {
    //                   $arrayElemAt: [
    //                     {
    //                       $filter: {
    //                         input: "$attendedByDetails", // Filter attendedBy details
    //                         as: "attended",
    //                         cond: {
    //                           $eq: [
    //                             "$$attended._id", // Match attendedBy user ID
    //                             {
    //                               $arrayElemAt: [
    //                                 "$$registration.formdata.attendedBy.callerId",
    //                                 0
    //                               ]
    //                             }
    //                           ]
    //                         }
    //                       }
    //                     },
    //                     0
    //                   ]
    //                 }
    //               }
    //             ]
    //           }
    //         }
    //       }
    //     }
    //   },
    //   {
    //     $addFields: {
    //       // Map callregistration to include completedBy details
    //       callregistration: {
    //         $map: {
    //           input: "$callregistration", // Iterate over callregistration array
    //           as: "registration",
    //           in: {
    //             $mergeObjects: [
    //               "$$registration", // Preserve existing callregistration fields
    //               {
    //                 completedbydetails: {
    //                   $arrayElemAt: [
    //                     {
    //                       $filter: {
    //                         input: "$completedByDetails", // Filter completedBy details
    //                         as: "completed",
    //                         cond: {
    //                           $eq: [
    //                             "$$completed._id", // Match completedBy user ID
    //                             {
    //                               $arrayElemAt: [
    //                                 "$$registration.formdata.completedBy.callerId",
    //                                 0
    //                               ]
    //                             }
    //                           ]
    //                         }
    //                       }
    //                     },
    //                     0
    //                   ]
    //                 }
    //               }
    //             ]
    //           }
    //         }
    //       }
    //     }
    //   },
    //   {
    //     $project: {
    //       customerName: 1, // Include necessary fields in the result

    //       callregistration: 1
    //     }
    //   }
    // ])
    // Summary only needs matching calls and their product names. Filter and
    // paginate before the product lookup so long reports return immediately.
    const summaryRangePipeline = [
      {
        $match: {
          "callregistration.timedata.startTime": { $gte: start, $lte: end }
        }
      },
      {
        $project: {
          customerName: 1,
          callregistration: {
            $filter: {
              input: "$callregistration",
              as: "call",
              cond: {
                $and: [
                  { $ne: ["$$call.timedata.startTime", null] },
                  { $gte: ["$$call.timedata.startTime", start] },
                  { $lte: ["$$call.timedata.startTime", end] }
                ]
              }
            }
          }
        }
      },
      { $match: { callregistration: { $ne: [] } } }
    ]

    const summaryCustomerCalls = await CallRegistration.aggregate([
        ...summaryRangePipeline,
        { $skip: skip },
        { $limit: limit + 1 },
      {
        $lookup: {
          from: "products",
          localField: "callregistration.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $addFields: {
          callregistration: {
            $map: {
              input: "$callregistration",
              as: "registration",
              in: {
                $mergeObjects: [
                  "$$registration",
                  {
                    productdetails: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$productDetails",
                            as: "product",
                            cond: { $eq: ["$$product._id", "$$registration.product"] }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          customerName: 1,
          callregistration: {
            $map: {
              input: "$callregistration",
              as: "registration",
              in: {
                product: "$$registration.product",
                productdetails: {
                  productName: "$$registration.productdetails.productName"
                },
                license: "$$registration.license",
                branchName: "$$registration.branchName",
                timedata: "$$registration.timedata",
                formdata: {
                  status: "$$registration.formdata.status",
                  incomingNumber: "$$registration.formdata.incomingNumber",
                  description: "$$registration.formdata.description",
                  solution: "$$registration.formdata.solution"
                }
              }
            }
          }
        }
      }
      ]).allowDiskUse(true)

    const hasMore = summaryCustomerCalls.length > limit
    const pagedCustomerCalls = hasMore
      ? summaryCustomerCalls.slice(0, limit)
      : summaryCustomerCalls

    return res.status(200).json({
      message: "customercalls found",
      data: pagedCustomerCalls,
      pagination: {
        page,
        limit,
        hasMore
      }
    })

    const customerCalls = await CallRegistration.aggregate([
      {
        $match: {
          callregistration: { $exists: true, $ne: [] },
          "callregistration.timedata.startTime": { $gte: start, $lte: end }
        }
      },

      {
        $addFields: {
          callregistration: {
            $filter: {
              input: "$callregistration",
              as: "call",
              cond: {
                $and: [
                  { $ne: ["$$call.timedata.startTime", null] },
                  { $gte: ["$$call.timedata.startTime", start] },
                  { $lte: ["$$call.timedata.startTime", end] }
                ]
              }
            }
          }
        }
      },

      {
        $match: {
          callregistration: { $ne: [] }
        }
      },

      {
        $lookup: {
          from: "products",
          localField: "callregistration.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },

      {
        $lookup: {
          from: "staffs",
          localField: "callregistration.formdata.attendedBy.callerId",
          foreignField: "_id",
          as: "attendedByStaffDetails"
        }
      },

      {
        $lookup: {
          from: "admins",
          localField: "callregistration.formdata.attendedBy.callerId",
          foreignField: "_id",
          as: "attendedByAdminDetails"
        }
      },

      {
        $lookup: {
          from: "staffs",
          localField: "callregistration.formdata.completedBy.callerId",
          foreignField: "_id",
          as: "completedByStaffDetails"
        }
      },

      {
        $lookup: {
          from: "admins",
          localField: "callregistration.formdata.completedBy.callerId",
          foreignField: "_id",
          as: "completedByAdminDetails"
        }
      },

      {
        $addFields: {
          attendedByDetails: {
            $concatArrays: [
              { $ifNull: ["$attendedByStaffDetails", []] },
              { $ifNull: ["$attendedByAdminDetails", []] }
            ]
          },
          completedByDetails: {
            $concatArrays: [
              { $ifNull: ["$completedByStaffDetails", []] },
              { $ifNull: ["$completedByAdminDetails", []] }
            ]
          }
        }
      },

      {
        $addFields: {
          callregistration: {
            $map: {
              input: "$callregistration",
              as: "registration",
              in: {
                $mergeObjects: [
                  "$$registration",
                  {
                    productdetails: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$productDetails",
                            as: "product",
                            cond: {
                              $eq: ["$$product._id", "$$registration.product"]
                            }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },

      {
        $addFields: {
          callregistration: {
            $map: {
              input: "$callregistration",
              as: "registration",
              in: {
                $mergeObjects: [
                  "$$registration",
                  {
                    attendeddetails: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$attendedByDetails",
                            as: "attended",
                            cond: {
                              $eq: [
                                "$$attended._id",
                                {
                                  $arrayElemAt: [
                                    {
                                      $ifNull: [
                                        "$$registration.formdata.attendedBy.callerId",
                                        []
                                      ]
                                    },
                                    0
                                  ]
                                }
                              ]
                            }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },

      {
        $addFields: {
          callregistration: {
            $map: {
              input: "$callregistration",
              as: "registration",
              in: {
                $mergeObjects: [
                  "$$registration",
                  {
                    completedbydetails: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$completedByDetails",
                            as: "completed",
                            cond: {
                              $eq: [
                                "$$completed._id",
                                {
                                  $arrayElemAt: [
                                    {
                                      $ifNull: [
                                        "$$registration.formdata.completedBy.callerId",
                                        []
                                      ]
                                    },
                                    0
                                  ]
                                }
                              ]
                            }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },

      {
        $project: {
          customerName: 1,
          callregistration: 1
        }
      }
    ])

    return res
      .status(200)
      .json({ message: "customercalls found", data: customerCalls })
  } catch (error) {
    console.log("error:", error.message)
    return res.status(500).json({ message: "internal server error" })
  }
}
export const CallnoteRegistration = async (req, res) => {
  try {
    const formdata = req.body

    const existingItem = await CallNote.findOne({
      callNotes: formdata.callNotes
    })
    if (existingItem) {
      return res
        .status(400)
        .json({ message: "This callnotes  is already registered" })
    }

    // Create and save call notes
    const collection = new CallNote({
      callNotes: formdata.callNotes
    })

    await collection.save()

    res.status(200).json({
      status: true,
      message: "Call notes created successfully",
      data: collection
    })
  } catch (error) {
    console.log("error:", error.message)
  }
}
export const PartnerRegistration = async (req, res) => {
  try {
    const formdata = req.body

    const existingItem = await Partner.findOne({
      partner: formdata.partner
    })
    if (existingItem) {
      return res
        .status(400)
        .json({ message: "This callnotes  is already registered" })
    }

    // Create partner

    await Partner.create({
      partner: formdata.partnerName.toUpperCase(),
      relationBranches: formdata.branchName.map(branchId => ({
        companyName: formdata.companyName,
        branchName: branchId
      }))
    });


    res.status(200).json({
      status: true,
      message: "Partner created successfully",

    })
  } catch (error) {
    console.log("error:", error.message)
  }
}
export const ServicesRegistration = async (req, res) => {
  try {
    const formdata = req.body
    const { serviceName, price, company, branch } = formdata

    const existingItem = await Service.findOne({
      serviceName
    })
    if (existingItem) {
      return res
        .status(400)
        .json({ message: "This service is already registered" })
    }

    // Create and save call notes
    const collection = new Service({
      serviceName,
      price,
      company,
      branch
    })

    await collection.save()

    res.status(200).json({
      status: true,
      message: "Service created successfully"
    })
  } catch (error) {
    console.log("error:", error.message)
  }
}

export const CustomerRegister = async (req, res) => {
  const { customerData, tabledata = [] } = req.body
  const { createdfrom } = req.query
  const {
    customerName,
    customerid,
    address1,
    address2,
    country,
    state,
    city,
    pincode,
    contactPerson,
    email,
    mobile,
    landline,
    registrationType,
    gstNo,
    isPartner = false,
    partnerSelection,
    isActive = "Running"
  } = customerData
  if (tabledata && tabledata?.length > 0) {
    // const licenseNumbers = tabledata.map((item) => item.licensenumber)
    const licenseNumbers = tabledata
      .filter(
        (item) =>
          item?.licensenumber !== null &&
          item?.licensenumber !== undefined &&
          String(item.licensenumber).trim() !== ""
      )
      .map((item) => item.licensenumber)
    // Check if user already exists

    const existingLicenses = await License.find({
      licensenumber: { $in: licenseNumbers }
    })
    if (existingLicenses && existingLicenses?.length > 0) {
      return res
        .status(400)
        .json({ message: "License number already registered" })
    }
  }

  try {
    const customerIsPartner = isPartner === true || isPartner === "true"
    const normalizedPartner =
      customerIsPartner &&
      customerData.partner &&
      customerData.partner.trim() !== ""
        ? customerData.partner
        : null
    const normalizedPartnerSelection =
      partnerSelection &&
      String(partnerSelection).trim() !== ""
        ? partnerSelection
        : null
    const customer = new Customer({
      customerName,
      address1,
      address2,
      country,
      state,
      city,
      pincode,
      createdFrom: createdfrom,
      email,

      mobile,
      landline,
      registrationType,
      gstNo,
      isActive: isActive || "Running",
      isPartner: customerIsPartner,
      partner: normalizedPartner,
      partnerSelection: normalizedPartnerSelection,
      contactPerson,
      selected: tabledata
    })
    const customerdata = await customer.save()
    if (tabledata && tabledata.length > 0) {
      for (const item of customerdata.selected) {
        const license = new License({
          products: item.product_id,
          customerName: customerdata._id, // Using the customer ID from the parent object
          licensenumber: item.licensenumber
        })

        await license.save()
      }
    }

    return res.status(200).json({
      status: true,
      message: "Customer created successfully"
    })
  } catch (error) {
    console.log("error:", error)
    res.status(500).json({ message: "server error" })
  }
}
export const CustomereditonLead = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { customerData } = req.body;


    if (!customerData?.customerid) {
      return res.status(400).json({ message: "Customerid is required" });
    }

    if (!customerData?.leadid) {
      return res.status(400).json({ message: "Leadid is required" });
    }

    if (
      !isValidObjectId(customerData.customerid) ||
      !isValidObjectId(customerData.leadid)
    ) {
      return res
        .status(400)
        .json({ message: "Customerid or leadid is not a valid ObjectId" });
    }

    let updatedcustomer = null;
    let updateleadmaster = null;

    await session.withTransaction(async () => {
      updatedcustomer = await Customer.findOneAndUpdate(
        { _id: customerData.customerid },
        {
          $set: {
            customerName: customerData?.customerName?.trim(),
            email: customerData?.email?.trim(),
            mobile: customerData?.mobile?.trim(),
            landline: customerData?.landline?.trim(),
            contactPerson: customerData?.contactPerson?.trim(),
            address1: customerData?.address1?.trim(),
            country: customerData?.country?.trim(),
            state: customerData?.state?.trim(),
            city: customerData?.city?.trim(),
            pincode: customerData?.pincode?.trim(),
            partner: customerData?.partner || null,
            registrationType: customerData?.registrationType || null
          }
        },
        {
          returnDocument: "after",
          runValidators: true,
          session
        }
      );

      if (!updatedcustomer) {
        throw new Error("Customer not found");
      }

      updateleadmaster = await LeadMaster.findOneAndUpdate(
        { _id: customerData.leadid },
        {
          $set: {
            mobile: customerData?.mobile?.trim(),
            email: customerData?.email?.trim(),
            phone: customerData?.landline?.trim(),
            partner: customerData?.partner || null
          }
        },
        {
          returnDocument: "after",
          runValidators: true,
          session
        }
      );

      if (!updateleadmaster) {
        throw new Error("LeadMaster not found");
      }
    });

    return res.status(200).json({
      message: "Customer and lead updated successfully",
      data: updatedcustomer
    });
  } catch (error) {
    console.log("error", error.message);

    if (error.message === "Customer not found" || error.message === "LeadMaster not found") {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
};


/**
 * Lightweight typed error so the catch block can distinguish
 * "expected" failures (bad input, not found) from real server errors
 * and respond with the right status code instead of a blanket 500.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
  }
}

// export const CustomerEdit = async (req, res) => {
//   const { customerData, tableData } = req.body
//   const { customerid } = req.query

//   if (!customerid || !customerData) {
//     return res.status(400).json({ message: "Customer ID and data are required" })
//   }

//   if (!mongoose.Types.ObjectId.isValid(customerid)) {
//     return res.status(400).json({ message: "Invalid customer ID" })
//   }

//   const session = await mongoose.startSession()

//   try {
//     session.startTransaction()

//     const objectId = new mongoose.Types.ObjectId(customerid)
//     const existingCustomer = await Customer.findById(objectId).session(session)

//     if (!existingCustomer) {
//       throw new AppError("Customer not found", 404)
//     }

//     Object.assign(existingCustomer, customerData)

//     const oldSelected = Array.isArray(existingCustomer.selected)
//       ? [...existingCustomer.selected]
//       : []

//     const keyOf = (item) => String(item?.productid || item?.product_id)

//     if (Array.isArray(tableData)) {
//       const existingMap = new Map(oldSelected.map((item) => [keyOf(item), item]))

//       const nextSelected = tableData.map((incomingItem) => {
//         const existingItem = existingMap.get(keyOf(incomingItem))

//         if (!existingItem) {
//           return {
//             ...incomingItem,
//             taggeddata: Array.isArray(incomingItem?.taggeddata)
//               ? incomingItem.taggeddata
//               : []
//           }
//         }

//         const mergedTaggedData = [...(existingItem.taggeddata || [])]

//           ; (incomingItem.taggeddata || []).forEach((incomingTag) => {
//             const tagIndex = mergedTaggedData.findIndex(
//               (tag) =>
//                 String(tag?.licensenumber) === String(incomingTag?.licensenumber)
//             )

//             if (tagIndex >= 0) {
//               mergedTaggedData[tagIndex] = {
//                 ...mergedTaggedData[tagIndex],
//                 ...incomingTag
//               }
//             } else {
//               mergedTaggedData.push(incomingTag)
//             }
//           })

//         return {
//           ...existingItem,
//           ...incomingItem,
//           taggeddata: mergedTaggedData
//         }
//       })

//       existingCustomer.selected = nextSelected

//       const incomingProductKeySet = new Set(tableData.map((item) => keyOf(item)))

//       const removedProducts = oldSelected.filter(
//         (item) => !incomingProductKeySet.has(keyOf(item))
//       )

//       const removedProductIds = [
//         ...new Set(
//           removedProducts
//             .map((item) => item?.productid || item?.product_id)
//             .filter(Boolean)
//             .map((id) => String(id))
//         )
//       ]

//       if (removedProductIds.length > 0) {
//         const primaryProducts = await Product.find({
//           _id: {
//             $in: removedProductIds.map((id) => new mongoose.Types.ObjectId(id))
//           },
//           productorservicetype: "Primaryproduct"
//         })
//           .session(session)
//           .select("_id")

//         const primaryProductIds = primaryProducts.map((item) => item._id)

//         if (primaryProductIds.length > 0) {
//           await License.deleteMany({
//             customerName: existingCustomer._id,
//             products: { $in: primaryProductIds }
//           }).session(session)
//         }
//       }
//     }

//     await existingCustomer.save({ session })

//     const directLicenseNumbers = Array.isArray(tableData)
//       ? tableData
//         .filter(
//           (item) =>
//             item?.licensenumber !== null &&
//             item?.licensenumber !== undefined &&
//             String(item?.licensenumber).trim() !== ""
//         )
//         .map((item) => ({
//           licensenumber: Number(item.licensenumber),
//           productid: item?.productid || item?.product_id || null
//         }))
//       : []

//     const taggedLicenseNumbers = Array.isArray(tableData)
//       ? tableData.flatMap((item) =>
//         Array.isArray(item?.taggeddata)
//           ? item.taggeddata
//             .filter(
//               (tag) =>
//                 tag?.licensenumber !== null &&
//                 tag?.licensenumber !== undefined &&
//                 String(tag?.licensenumber).trim() !== ""
//             )
//             .map((tag) => ({
//               licensenumber: Number(tag.licensenumber),
//               productid: item?.productid || item?.product_id || null
//             }))
//           : []
//       )
//       : []

//     const allLicenses = [...directLicenseNumbers, ...taggedLicenseNumbers]

//     const uniqueLicenseMap = new Map()
//     for (const item of allLicenses) {
//       if (!uniqueLicenseMap.has(String(item.licensenumber))) {
//         uniqueLicenseMap.set(String(item.licensenumber), item)
//       }
//     }

//     const uniqueLicenses = Array.from(uniqueLicenseMap.values())
//     const licenseNumbers = uniqueLicenses.map((item) => item.licensenumber)

//     if (licenseNumbers.length > 0) {
//       const existingLicenses = await License.find({
//         customerName: existingCustomer._id,
//         licensenumber: { $in: licenseNumbers }
//       })
//         .session(session)
//         .select("licensenumber")

//       const existingLicenseSet = new Set(
//         existingLicenses.map((item) => String(item.licensenumber))
//       )

//       const newLicenses = uniqueLicenses.filter(
//         (item) => !existingLicenseSet.has(String(item.licensenumber))
//       )

//       if (newLicenses.length > 0) {
//         const licenseDocs = newLicenses.map((item) => ({
//           products: item.productid,
//           customerName: existingCustomer._id,
//           licensenumber: item.licensenumber
//         }))

//         await License.insertMany(licenseDocs, { session })
//       }
//     }

//     await session.commitTransaction()
//     return res.status(200).json({ message: "Customer updated successfully" })
//   } catch (error) {
//     await session.abortTransaction()

//     console.error("Error updating customer:", error.message)

//     if (error instanceof AppError) {
//       return res.status(error.statusCode).json({ message: error.message })
//     }

//     if (error.name === "ValidationError") {
//       return res.status(400).json({ message: error.message })
//     }

//     if (error.name === "CastError") {
//       return res.status(400).json({ message: "Invalid ID format" })
//     }

//     return res.status(500).json({ message: "Internal server error" })
//   } finally {
//     session.endSession()
//   }
// }
export const CustomerEdit = async (req, res) => {
  const { customerData, tableData } = req.body
  const { customerid } = req.query

  if (!customerid || !customerData) {
    return res.status(400).json({
      message: "Customer ID and data are required"
    })
  }

  if (!mongoose.Types.ObjectId.isValid(customerid)) {
    return res.status(400).json({
      message: "Invalid customer ID"
    })
  }

  if (tableData !== undefined && !Array.isArray(tableData)) {
    return res.status(400).json({
      message: "tableData must be an array"
    })
  }

  const session = await mongoose.startSession()

  try {
    session.startTransaction()

    const objectId = new mongoose.Types.ObjectId(customerid)

    const existingCustomer = await Customer.findById(objectId).session(
      session
    )

    if (!existingCustomer) {
      throw new AppError("Customer not found", 404)
    }

    /*
      Update only normal customer fields.
      Prevent request values from accidentally changing selected directly.
    */
    const {
      selected,
      isActive,
      isPartner,
      partner,
      partnerSelection,
      ...safeCustomerData
    } = customerData

    Object.assign(existingCustomer, safeCustomerData)

    if (isPartner !== undefined) {
      const customerIsPartner = isPartner === true || isPartner === "true"
      existingCustomer.isPartner = customerIsPartner
      existingCustomer.partner = customerIsPartner && partner ? partner : null
    }

    if (isPartner === undefined && partner !== undefined) {
      existingCustomer.partner = partner || null
    }

    if (partnerSelection !== undefined) {
      existingCustomer.partnerSelection = partnerSelection || null
    }

    // Keep the stored status when an older client does not send this field.
    if (isActive !== undefined) {
      existingCustomer.isActive = isActive
    }

    const oldSelected = Array.isArray(existingCustomer.selected)
      ? existingCustomer.selected.map((item) => item.toObject?.() || item)
      : []

    const getProductKey = (item) => {
      const id = item?.productid || item?.product_id || item?._id
      return id ? String(id) : null
    }

    const normalizeLicenseNumber = (value) => {
      if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
      ) {
        return null
      }

      return String(value).trim()
    }

    const normalizeTaggedData = (taggeddata, previousTaggedData = []) => {
      if (!Array.isArray(taggeddata)) {
        return []
      }

      const previousTagMap = new Map(
        (Array.isArray(previousTaggedData) ? previousTaggedData : [])
          .filter((tag) => normalizeLicenseNumber(tag?.licensenumber))
          .map((tag) => [
            normalizeLicenseNumber(tag.licensenumber),
            tag?.toObject?.() || tag
          ])
      )

      /*
        tableData.taggeddata is the source of truth.

        Only incoming tags are returned.
        A tag existing in MongoDB but absent from tableData is removed.
      */
      return taggeddata
        .filter((tag) => normalizeLicenseNumber(tag?.licensenumber))
        .map((incomingTag) => {
          const licenseKey = normalizeLicenseNumber(
            incomingTag.licensenumber
          )

          const previousTag = previousTagMap.get(licenseKey) || {}

          /*
            Existing values are kept only where frontend does not provide
            the field. Incoming data overrides old data.
          */
          return {
            ...previousTag,
            ...incomingTag,
            licensenumber: Number(licenseKey)
          }
        })
    }

    if (Array.isArray(tableData)) {
      const oldSelectedMap = new Map(
        oldSelected
          .filter((item) => getProductKey(item))
          .map((item) => [getProductKey(item), item])
      )

      /*
        Complete replacement strategy:

        nextSelected contains ONLY products/services sent from tableData.
        Therefore:
        - Missing product/service rows are deleted.
        - Missing taggeddata entries are deleted.
      */
      const nextSelected = tableData.map((incomingItem) => {
        const productKey = getProductKey(incomingItem)
        const oldItem = productKey
          ? oldSelectedMap.get(productKey)
          : null

        const oldTaggedData = Array.isArray(oldItem?.taggeddata)
          ? oldItem.taggeddata
          : []

        const exactTaggedData = normalizeTaggedData(
          incomingItem?.taggeddata,
          oldTaggedData
        )

        return {
          /*
            Keep old fields only if frontend does not have them.
            Incoming item always has priority.
          */
          ...(oldItem || {}),
          ...incomingItem,

          /*
            Required:
            The taggeddata saved to MongoDB contains only current
            tableData taggeddata items.
          */
          taggeddata: exactTaggedData,

          /*
            Always generate taggedLicenses from taggeddata.
            This avoids a mismatch between the two arrays.
          */
          taggedLicenses: exactTaggedData.map((tag) =>
            String(tag.licensenumber)
          )
        }
      })

      /*
        Find fully removed products/services.
        Used to delete License documents only for removed PRIMARY products.
      */
      const incomingProductKeys = new Set(
        tableData
          .map((item) => getProductKey(item))
          .filter(Boolean)
      )

      const fullyRemovedProducts = oldSelected.filter((oldItem) => {
        const oldProductKey = getProductKey(oldItem)

        return (
          oldProductKey &&
          !incomingProductKeys.has(oldProductKey)
        )
      })

      const removedProductIds = [
        ...new Set(
          fullyRemovedProducts
            .map((item) => item?.productid || item?.product_id)
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => String(id))
        )
      ]

      /*
        Save the exact current table data to selected.
      */
      existingCustomer.selected = nextSelected

      /*
        Required if `selected` is Mixed / [{ }] / schema-less.
        It is safe even for many regular subdocument-array schemas.
      */
      existingCustomer.markModified("selected")

      /*
        Delete License documents only if the entire associated primary
        product row has been removed from the customer.
      */
      if (removedProductIds.length > 0) {
        const primaryProducts = await Product.find({
          _id: {
            $in: removedProductIds.map(
              (id) => new mongoose.Types.ObjectId(id)
            )
          },
          productorservicetype: "Primaryproduct"
        })
          .session(session)
          .select("_id")

        const primaryProductIds = primaryProducts.map((item) => item._id)

        if (primaryProductIds.length > 0) {
          await License.deleteMany({
            customerName: existingCustomer._id,
            products: {
              $in: primaryProductIds
            }
          }).session(session)
        }
      }
    }

    await existingCustomer.save({ session })

    /*
      Build all licenses currently present in tableData.

      Direct licenses:
      - Primary Product row's `licensenumber`

      Tagged licenses:
      - Additional Service `taggeddata[].licensenumber`
    */
    const directLicenseNumbers = Array.isArray(tableData)
      ? tableData
        .filter((item) => {
          const licenseNo = normalizeLicenseNumber(
            item?.licensenumber
          )

          return Boolean(licenseNo)
        })
        .map((item) => ({
          licensenumber: Number(
            normalizeLicenseNumber(item.licensenumber)
          ),
          productid: item?.productid || item?.product_id || null
        }))
      : []

    const taggedLicenseNumbers = Array.isArray(tableData)
      ? tableData.flatMap((item) => {
        const tags = Array.isArray(item?.taggeddata)
          ? item.taggeddata
          : []

        return tags
          .filter((tag) =>
            Boolean(normalizeLicenseNumber(tag?.licensenumber))
          )
          .map((tag) => ({
            licensenumber: Number(
              normalizeLicenseNumber(tag.licensenumber)
            ),

            /*
              This product ID is only used if a License document
              does not already exist for this customer/license number.

              Usually tagged licenses already belong to a Primary Product.
            */
            productid: item?.productid || item?.product_id || null
          }))
      })
      : []

    const allLicenses = [
      ...directLicenseNumbers,
      ...taggedLicenseNumbers
    ]

    /*
      Same license number may appear:
      - Once as a primary-product license
      - Again inside an additional-service taggeddata list

      Use one License document per customer + license number.
      Prefer the direct primary-product mapping when it exists.
    */
    const uniqueLicenseMap = new Map()

    for (const license of allLicenses) {
      const key = String(license.licensenumber)
      const hasDirectLicense = directLicenseNumbers.some(
        (directLicense) =>
          String(directLicense.licensenumber) === key
      )

      if (!uniqueLicenseMap.has(key) || hasDirectLicense) {
        uniqueLicenseMap.set(key, license)
      }
    }

    const uniqueLicenses = Array.from(uniqueLicenseMap.values())

    const licenseNumbers = uniqueLicenses.map(
      (item) => item.licensenumber
    )

    /*
      Add missing license master records.
      Existing license records are not removed when they disappear
      from an Additional Service tag, because those licenses may still
      belong to Primary Products.
    */
    if (licenseNumbers.length > 0) {
      const existingLicenses = await License.find({
        customerName: existingCustomer._id,
        licensenumber: {
          $in: licenseNumbers
        }
      })
        .session(session)
        .select("licensenumber")

      const existingLicenseSet = new Set(
        existingLicenses.map((item) => String(item.licensenumber))
      )

      const newLicenses = uniqueLicenses.filter(
        (item) =>
          !existingLicenseSet.has(String(item.licensenumber)) &&
          item.productid &&
          mongoose.Types.ObjectId.isValid(item.productid)
      )

      if (newLicenses.length > 0) {
        const licenseDocs = newLicenses.map((item) => ({
          products: new mongoose.Types.ObjectId(item.productid),
          customerName: existingCustomer._id,
          licensenumber: item.licensenumber
        }))

        await License.insertMany(licenseDocs, {
          session
        })
      }
    }

    await session.commitTransaction()

    return res.status(200).json({
      message: "Customer updated successfully"
    })
  } catch (error) {
    await session.abortTransaction()

    console.error("Error updating customer:", error)

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message
      })
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      })
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid ID format"
      })
    }

    return res.status(500).json({
      message: "Internal server error"
    })
  } finally {
    session.endSession()
  }
}//removed tagged license
export const DeleteCustomer = async (req, res) => {
  const { id } = req.query

  try {
    // Perform the deletion
    const result = await Customer.findByIdAndDelete(id)

    if (result) {
      return res.status(200).json({ message: "Customer deleted successfully" })
    } else {
      return res.status(404).json({ message: "Customer not found" })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Server error" })
  }
}
export const GetallproductmissingCustomer = async (req, res) => {
  try {
    const { branchselected } = req.query
    const branchIds = Array.isArray(branchselected)
      ? branchselected
      : [branchselected];


    const customers = await Customer.find({
      // Match documents where the "selected" array has at least one element that satisfies:
      selected: {
        $elemMatch: {
          branch_id: { $in: branchIds },     // branch_id must match one of the given branchIds
          $or: [
            { product_id: { $exists: false } }, // product_id field is missing
            { product_id: null }                // OR product_id is explicitly null
          ]
        }
      }
    })
      // Use collation to make sorting case-insensitive (so "Apple" and "apple" are treated the same)
      .collation({ locale: "en", strength: 2 })
      // Sort results alphabetically by customerName (A → Z)
      .sort({ customerName: 1 })

    res.status(200).json({ message: "custoemers without productmissing found", data: customers });


  } catch (error) {
    console.log("error", error.message)
    return res.status(500).json({ message: "Internal server error" })
  }
}
export const GetAllCustomer = async (req, res) => {
  try {
    const { branchSelected } = req.query



    if (!branchSelected) {
      return res.status(400).json({ message: "branch id is missing" })

    }



    const objectIds = new mongoose.Types.ObjectId(branchSelected)
    // Do the branch filter in MongoDB. Previously this endpoint loaded every
    // customer and every branch's product/license history before filtering it
    // in Node, making the lead form slower as the dataset grew.
    const customers = await Customer.aggregate([
      {
        $match: {
          $or: [
            { selected: { $eq: [] } },
            { "selected.branch_id": objectIds }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          customerName: 1,
          address1: 1,
          mobile: 1,
          landline: 1,
          email: 1,
          partner: 1,
          partnerSelection: 1,
          isPartner: 1,
          gstNo: 1,
          registrationType: 1,
          city: 1,
          pincode: 1,
          contactPerson: 1,
          country: 1,
          state: 1,
          // The lead form only uses the current branch's history.
          selected: {
            $filter: {
              input: { $ifNull: ["$selected", []] },
              as: "selection",
              cond: { $eq: ["$$selection.branch_id", objectIds] }
            }
          }
        }
      }
    ])

    return res
      .status(200)
      .json({ message: "customers found", data: customers })

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}



export const GetselectedCustomerForCall = async (req, res) => {
  try {
    const customerId = req.params.id;
    // console.log("ciddddd", customerId);

    const customer = await Customer.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(customerId) } },
      {
        $lookup: {
          from: "partners",
          localField: "partner",
          foreignField: "_id",
          as: "partnerDetails"
        }
      },

      // Unwind the 'selected' array to join each branch/product separately
      { $unwind: { path: "$selected", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "companies",
          localField: "selected.company_id",
          foreignField: "_id",
          as: "companyDetails"
        }
      },
      { $unwind: { path: "$companyDetails", preserveNullAndEmptyArrays: true } },

      // Lookup branch details
      {
        $lookup: {
          from: "branches",
          localField: "selected.branch_id",
          foreignField: "_id",
          as: "branchDetails"
        }
      },
      { $unwind: { path: "$branchDetails", preserveNullAndEmptyArrays: true } },

      // Lookup product details
      {
        $lookup: {
          from: "products",
          localField: "selected.product_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },


      {
        $addFields: {
          "selected.product_id": "$productDetails",
          "selected.branch_id": "$branchDetails",
          "selected.company_id": "$companyDetails"
        }
      },

      // Group back to restore original customer document structure
      {
        $group: {
          _id: "$_id",
          customerName: { $first: "$customerName" },
          email: { $first: "$email" },
          mobile: { $first: "$mobile" },
          address1: { $first: "$address1" },
          state: { $first: "$state" },
          pincode: { $first: "$pincode" },
          industry: { $first: "$industry" },

          partner: { $first: "$partnerDetails" },
          selected: { $push: "$selected" } // push all selected with branch/product details
        }
      }
    ]);

    if (!customer || customer.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({ messaage: "customer found", data: customer });
  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};



export const GetCustomer = async (req, res) => {
  console.log("hhhhhhhhhhhhhhhhhhhhh")

  const search = req.query?.search?.trim() || ""
  const role = req.query?.role
  const userBranch = req.query?.userBranch
  const pendingCustomerList = req.query?.pendingCustomerList

  let parsedBranch = []
  let objectIds = []

  const escapeRegex = (value = "") =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  const hasValidLicense = (value) => {
    return value !== undefined && value !== null && String(value).trim() !== ""
  }

  const filterSelectedWithLicense = (selected = []) => {
    return Array.isArray(selected)
      ? selected.filter((item) => hasValidLicense(item?.licensenumber))
      : []
  }

  const toObjectIdExpr = (path) => ({
    $convert: {
      input: path,
      to: "objectId",
      onError: null,
      onNull: null,
    },
  })

  const shouldRestrictToPrimaryProduct = role !== "Admin"

  const getPopulateSelectedStages = ({ onlyPrimaryProduct = false } = {}) => {
    const stages = [
      {
        $unwind: {
          path: "$selected",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "selected.branchObjectId": toObjectIdExpr("$selected.branch_id"),
          "selected.companyObjectId": toObjectIdExpr("$selected.company_id"),
          "selected.productObjectId": toObjectIdExpr("$selected.product_id"),
          partnerObjectId: toObjectIdExpr("$partner"),
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "selected.branchObjectId",
          foreignField: "_id",
          as: "branchDetails",
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "selected.companyObjectId",
          foreignField: "_id",
          as: "companyDetails",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "selected.productObjectId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $lookup: {
          from: "partners",
          localField: "partnerObjectId",
          foreignField: "_id",
          as: "partnerDetails",
        },
      },
      {
        $addFields: {
          partner: { $arrayElemAt: ["$partnerDetails", 0] },
          "selected.branch_id": {
            $let: {
              vars: { branch: { $arrayElemAt: ["$branchDetails", 0] } },
              in: {
                $cond: [
                  { $ifNull: ["$$branch._id", false] },
                  {
                    _id: "$$branch._id",
                    branchName: "$$branch.branchName",
                  },
                  "$selected.branch_id",
                ],
              },
            },
          },
          "selected.company_id": {
            $let: {
              vars: { company: { $arrayElemAt: ["$companyDetails", 0] } },
              in: {
                $cond: [
                  { $ifNull: ["$$company._id", false] },
                  {
                    _id: "$$company._id",
                    companyName: "$$company.companyName",
                  },
                  "$selected.company_id",
                ],
              },
            },
          },
          "selected.product_id": {
            $cond: [
              { $gt: [{ $size: "$productDetails" }, 0] },
              { $arrayElemAt: ["$productDetails", 0] },
              "$selected.product_id",
            ],
          },
        },
      },
      ...(onlyPrimaryProduct
        ? [
          {
            $match: {
              $or: [
                { selected: null },
                {
                  "selected.product_id.productorservicetype": "Primaryproduct",
                },
              ],
            },
          },
        ]
        : []),
      {
        $project: {
          branchDetails: 0,
          companyDetails: 0,
          productDetails: 0,
          partnerDetails: 0,
          partnerObjectId: 0,
          "selected.branchObjectId": 0,
          "selected.companyObjectId": 0,
          "selected.productObjectId": 0,
        },
      },
      {
        $group: {
          _id: "$_id",
          customerName: { $first: "$customerName" },
          address1: { $first: "$address1" },
          address2: { $first: "$address2" },
          country: { $first: "$country" },
          registrationType: { $first: "$registrationType" },
          state: { $first: "$state" },
          city: { $first: "$city" },
          pincode: { $first: "$pincode" },
          email: { $first: "$email" },
          mobile: { $first: "$mobile" },
          landline: { $first: "$landline" },
          industry: { $first: "$industry" },
          contactPerson: { $first: "$contactPerson" },
          partner: { $first: "$partner" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          selected: { $push: "$selected" },
        },
      },
      {
        $addFields: {
          selected: {
            $filter: {
              input: "$selected",
              as: "item",
              cond: { $ne: ["$$item", null] },
            },
          },
        },
      },
    ]

    return stages
  }

  const normalizeCustomers = (customers = []) => {
    return customers.map((customer) => ({
      ...customer,
      selected: Array.isArray(customer?.selected)
        ? customer.selected.filter((item) => item != null)
        : [],
    }))
  }

  try {
    if (userBranch) {
      parsedBranch = JSON.parse(decodeURIComponent(userBranch))
    }

    if (Array.isArray(parsedBranch) && parsedBranch.length > 0) {
      objectIds = parsedBranch
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id))
    }

    if (
      search &&
      Array.isArray(parsedBranch) &&
      parsedBranch.length > 0 &&
      role !== "Admin"
    ) {
      if (!isNaN(search)) {
        const escapedSearch = escapeRegex(search)
        const searchRegex = new RegExp(`^${escapedSearch}`, "i")

        const mobileCustomerRaw = await Customer.find({
          mobile: searchRegex,
        }).lean()

        const licenseCustomerRaw = await Customer.find({
          $expr: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ["$selected", []] },
                    as: "item",
                    cond: {
                      $and: [
                        {
                          $ne: [
                            { $ifNull: ["$$item.licensenumber", null] },
                            null,
                          ],
                        },
                        {
                          $ne: [
                            {
                              $trim: {
                                input: { $toString: "$$item.licensenumber" },
                              },
                            },
                            "",
                          ],
                        },
                        {
                          $regexMatch: {
                            input: { $toString: "$$item.licensenumber" },
                            regex: escapedSearch,
                            options: "i",
                          },
                        },
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        }).lean()

        const mobileCustomerIds = mobileCustomerRaw.map((c) => c._id)
        const licenseCustomerIds = licenseCustomerRaw.map((c) => c._id)

        const allIds = [
          ...new Set(
            [...mobileCustomerIds, ...licenseCustomerIds].map((id) => String(id))
          ),
        ]
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id))

        if (!allIds.length) {
          return res.status(200).json({
            message: "No customer found",
            data: [],
          })
        }

        const customers = await Customer.aggregate([
          {
            $match: {
              _id: { $in: allIds },
              "selected.branch_id": { $in: objectIds },
            },
          },
          ...getPopulateSelectedStages({
            onlyPrimaryProduct: shouldRestrictToPrimaryProduct,
          }),
        ])

        const mergedCustomers = normalizeCustomers(customers)
          .map((customer) => {
            const fromMobile = mobileCustomerRaw.find(
              (x) => String(x._id) === String(customer._id)
            )
            const fromLicense = licenseCustomerRaw.find(
              (x) => String(x._id) === String(customer._id)
            )

            let selected = customer.selected || []

            if (fromLicense) {
              selected = selected.filter((item) =>
                new RegExp(escapedSearch, "i").test(
                  String(item?.licensenumber ?? "")
                )
              )
            } else if (fromMobile) {
              selected = filterSelectedWithLicense(selected)
            }

            return {
              ...customer,
              selected,
            }
          })
          .filter((customer) => customer.selected.length > 0)

        if (!mergedCustomers.length) {
          return res.status(404).json({
            message: "No customer found",
            data: [],
          })
        }

        return res.status(200).json({
          message: "Customer(s) found",
          data: mergedCustomers,
        })
      } else {
        const searchRegex = new RegExp(`^${escapeRegex(search)}`, "i")

        const customers = await Customer.aggregate([
          {
            $lookup: {
              from: "partners",
              localField: "partner",
              foreignField: "_id",
              as: "partnerDetails",
            },
          },
          {
            $addFields: {
              partnerName: { $arrayElemAt: ["$partnerDetails.partner", 0] },
            },
          },
          {
            $match: {
              $or: [{ customerName: searchRegex }, { partnerName: searchRegex }],
              "selected.branch_id": { $in: objectIds },
            },
          },
          ...getPopulateSelectedStages({
            onlyPrimaryProduct: shouldRestrictToPrimaryProduct,
          }),
        ])

        const normalizedCustomers = normalizeCustomers(customers)

        if (normalizedCustomers.length > 0) {
          return res.status(200).json({
            message: "Customer(s) found",
            data: normalizedCustomers,
          })
        }

        return res.status(200).json({
          message: "No customer found",
          data: [],
        })
      }
    } else if (search && role === "Admin") {
      if (!isNaN(search)) {
        const escapedSearch = escapeRegex(search)

        const mobileCustomerRaw = await Customer.find({
          $expr: {
            $regexMatch: {
              input: { $toString: "$mobile" },
              regex: escapedSearch,
              options: "i",
            },
          },
        }).lean()

        const licenseCustomerRaw = await Customer.find({
          $expr: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ["$selected", []] },
                    as: "item",
                    cond: {
                      $and: [
                        {
                          $ne: [
                            { $ifNull: ["$$item.licensenumber", null] },
                            null,
                          ],
                        },
                        {
                          $ne: [
                            {
                              $trim: {
                                input: { $toString: "$$item.licensenumber" },
                              },
                            },
                            "",
                          ],
                        },
                        {
                          $regexMatch: {
                            input: { $toString: "$$item.licensenumber" },
                            regex: escapedSearch,
                            options: "i",
                          },
                        },
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        }).lean()

        const allIds = [
          ...new Set(
            [...mobileCustomerRaw, ...licenseCustomerRaw].map((c) => String(c._id))
          ),
        ]
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id))

        if (!allIds.length) {
          return res.status(200).json({
            message: "No customer found",
            data: [],
          })
        }

        const customers = await Customer.aggregate([
          {
            $match: {
              _id: { $in: allIds },
            },
          },
          ...getPopulateSelectedStages({
            onlyPrimaryProduct: false,
          }),
        ])

        const mergedCustomers = normalizeCustomers(customers)
          .map((customer) => {
            const fromLicense = licenseCustomerRaw.find(
              (x) => String(x._id) === String(customer._id)
            )
            const fromMobile = mobileCustomerRaw.find(
              (x) => String(x._id) === String(customer._id)
            )

            let selected = customer.selected || []

            if (fromLicense) {
              selected = filterSelectedWithLicense(selected).filter((item) =>
                new RegExp(escapedSearch, "i").test(
                  String(item?.licensenumber ?? "")
                )
              )
            } else if (fromMobile) {
              selected = Array.isArray(selected)
                ? selected.filter((item) => item != null)
                : []
            }

            return {
              ...customer,
              selected,
            }
          })
          .filter(
            (customer) =>
              customer.selected.length > 0 ||
              mobileCustomerRaw.some((x) => String(x._id) === String(customer._id))
          )

        if (!mergedCustomers.length) {
          return res.status(404).json({
            message: "No customer found",
            data: [],
          })
        }

        return res.status(200).json({
          message: "Customer(s) found",
          data: mergedCustomers,
        })
      } else {
        const partnerRegex = new RegExp(`^${escapeRegex(search)}`, "i")

        const partnerIds = await Partner.find(
          { partner: partnerRegex },
          { _id: 1 }
        ).lean()

        const matchedPartnerIds = partnerIds.map((p) => p._id)
        const searchRegex = new RegExp(`^${escapeRegex(search)}`, "i")

        const customers = await Customer.aggregate([
          {
            $match: {
              $or: [
                { customerName: searchRegex },
                { mobile: searchRegex },
                ...(matchedPartnerIds.length
                  ? [{ partner: { $in: matchedPartnerIds } }]
                  : []),
              ],
            },
          },
          ...getPopulateSelectedStages({
            onlyPrimaryProduct: false,
          }),
          {
            $addFields: {
              selected: {
                $filter: {
                  input: "$selected",
                  as: "sel",
                  cond: {
                    $and: [
                      {
                        $ne: [{ $ifNull: ["$$sel.licensenumber", null] }, null],
                      },
                      {
                        $ne: [
                          {
                            $trim: {
                              input: { $toString: "$$sel.licensenumber" },
                            },
                          },
                          "",
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
          { $limit: 20 },
        ])

        if (customers.length > 0) {
          return res.status(200).json({
            message: "Customer(s) found",
            data: customers,
          })
        }

        return res.status(200).json({
          message: "No customer found",
          data: [],
        })
      }
    } else {
      let customers

      if (role === "Admin" || pendingCustomerList) {
        customers = await Customer.aggregate([
          { $sort: { customerName: 1 } },
          ...getPopulateSelectedStages({
            onlyPrimaryProduct: false,
          }),
        ])
      } else {
        if (!parsedBranch || parsedBranch.length === 0) {
          return res.status(403).json({
            message: "No branches assigned to staff",
          })
        }

        customers = await Customer.aggregate([
          {
            $match: {
              "selected.branch_id": { $in: objectIds },
            },
          },
          { $sort: { customerName: 1 } },
          ...getPopulateSelectedStages({
            onlyPrimaryProduct: true,
          }),
        ])
      }

      const normalizedCustomers = normalizeCustomers(customers)

      if (normalizedCustomers.length === 0) {
        return res.status(404).json({
          message: "No customer found",
          data: [],
        })
      }

      return res.status(200).json({
        message: "Customer(s) found",
        data: normalizedCustomers,
      })
    }
  } catch (error) {
    console.error("Error fetching customer data:", error)
    return res.status(500).json({
      message: "An error occurred while fetching customer data.",
      error: error.message,
    })
  }
}
export const GetLicense = async (req, res) => {
  try {
    const licensenumber = await License.find()

    if (licensenumber.length > 0) {
      res
        .status(200)
        .json({ message: "license number found", data: licensenumber })
    }
  } catch (err) {
    console.log(err.message)
    res.status(500).send("server error")
  }
}
// export const ChecklicenseForlead = async (req, res) => {
//   try {
//     const { licenseNumber,leadDocId } = req.query

//     if (!licenseNumber) {
//       return res.status(400).json({
//         message: "License number is required"
//       });
//     }

//     const licenseNo = Number(licenseNumber);
//     // console.log("licneseno,licenseNo", licenseNo)

//     const [leadExists, licenseExists] = await Promise.all([
//       Lead.findOne({
//         "leadFor.licenseNumber": licenseNo
//       }).select("_id"),

//       License.findOne({
//         licensenumber: licenseNo
//       }).select("_id")
//     ]);

//     return res.json({
//       exists: !!(leadExists || licenseExists),
//       source: leadExists
//         ? "Lead"
//         : licenseExists
//           ? "License"
//           : null
//     });
//   } catch (error) {
//     console.log("error", error.message)
//     return res.status(500).json({ message: "Internal server error" })
//   }
// }
export const ChecklicenseForlead = async (req, res) => {
  try {
    const { licenseNumber } = req.query;
    if (!licenseNumber) {
      return res.status(400).json({
        message: "License number is required",
      });
    }

    const licenseNo = Number(licenseNumber);

    const licenseExists = await License.findOne({
      licensenumber: licenseNo,
    }).select("_id");

    return res.json({
      exists: Boolean(licenseExists),
      source: licenseExists ? "License" : null,
    });
  } catch (error) {
    console.error("ChecklicenseForlead error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const customerCallRegistration = async (req, res) => {
  try {
    const { customerid, customer, branchName = {}, username } = req.query // Get customerid from query

    const calldata = req.body // Assuming calldata is sent in the body
    const emailsend = calldata.formdata.emailSend


    // Convert attendedBy.callerId to ObjectId
    const addTimes = (time1, time2) => {
      const parseTime = (time) => {
        const [hours, minutes, seconds] = time.split(":").map(Number)
        return { hours, minutes, seconds }
      }

      const formatTime = ({ hours, minutes, seconds }) => {
        // Handle overflow
        minutes += Math.floor(seconds / 60)
        seconds = seconds % 60

        hours += Math.floor(minutes / 60)
        minutes = minutes % 60

        return [
          hours.toString().padStart(2, "0"),
          minutes.toString().padStart(2, "0"),
          seconds.toString().padStart(2, "0")
        ].join(":")
      }

      const t1 = parseTime(time1)
      const t2 = parseTime(time2)

      const totalTime = {
        hours: t1.hours + t2.hours,
        minutes: t1.minutes + t2.minutes,
        seconds: t1.seconds + t2.seconds
      }

      return formatTime(totalTime)
    }
    if (
      calldata.formdata &&
      calldata.formdata.attendedBy &&
      calldata.formdata.attendedBy.callerId
    ) {
      calldata.formdata.attendedBy.callerId = new mongoose.Types.ObjectId(
        calldata.formdata.attendedBy.callerId
      )
    }
    if (
      calldata.formdata &&
      calldata.formdata.completedBy &&
      calldata.formdata.completedBy.callerId
    ) {
      calldata.formdata.completedBy.callerId = new mongoose.Types.ObjectId(
        calldata.formdata.completedBy.callerId
      )
    }

    // Convert customerid to ObjectId
    const customerId = new mongoose.Types.ObjectId(customerid)

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      throw new Error("Invalid ObjectId format")
    }

    // Find if there is already a call registration for this customer
    const user = await CallRegistration.findOne({ customerid: customerId })



    if (user) {
      const token = calldata.formdata.token
      if (token) {
        const callToUpdate = user.callregistration.find(
          (call) => call.timedata.token === token
        )

        // Function to convert "HH:MM:SS" format to total seconds

        if (callToUpdate) {
          if (!callToUpdate.timedata.time) {
            callToUpdate.timedata.time = 0 // Initialize time to 0 if it doesn't exist
          }
          // Update the fields with the new data

          callToUpdate.timedata.startTime = callToUpdate.timedata.startTime
          callToUpdate.timedata.endTime = calldata.timedata.endTime
          // Convert the total duration back to "HH:MM:SS" format
          callToUpdate.timedata.duration += calldata.timedata.duration

          callToUpdate.timedata.time = addTimes(
            callToUpdate.timedata.time,
            calldata.timedata.time
          )

          callToUpdate.timedata.token = calldata.timedata.token
          callToUpdate.formdata.incomingNumber =
            calldata.formdata.incomingNumber
          callToUpdate.formdata.token = calldata.formdata.token
          callToUpdate.formdata.description = calldata.formdata.description
          callToUpdate.formdata.callnote = calldata.formdata.callnote

          callToUpdate.formdata.solution = calldata.formdata.solution
          callToUpdate.formdata.status = calldata.formdata.status
          let existingAttendedBy = callToUpdate.formdata.attendedBy;

          // Convert to array if it's a string
          if (!Array.isArray(existingAttendedBy)) {
            existingAttendedBy = existingAttendedBy ? [existingAttendedBy] : [];
          }
          if (calldata.formdata.attendedBy) {
            existingAttendedBy.push(calldata.formdata.attendedBy);
          }

          // Assign it back to the document
          callToUpdate.formdata.attendedBy = existingAttendedBy;
          if (calldata.formdata.status === "solved") {
            const newCompletedBy = calldata.formdata.completedBy;

            if (newCompletedBy) {
              callToUpdate.formdata.completedBy = [];
              callToUpdate.formdata.completedBy.push(calldata.formdata.completedBy)
            } else {
              callToUpdate.formdata.completedBy = [];
            }

          }
          callToUpdate.license = calldata.license

          callToUpdate.branchName = Array.isArray(calldata.branchName)
            ? calldata.branchName
            : [calldata.branchName];

          // Save the updated document
          const updatedCall = await user.save()

          if (updatedCall) {
            const Id = calldata.formdata.attendedBy.callerId

            const staffCaller = await Staff.findOne({
              _id: Id
            })
            if (staffCaller) {
              if (calldata.formdata.status === "pending") {
                staffCaller.callstatus.totalCall += 1

                staffCaller.callstatus.pendingCalls += 1

                staffCaller.callstatus.totalDuration +=
                  calldata.timedata.duration

                const pendingSavedStaff = await staffCaller.save()

                if (pendingSavedStaff) {
                  const emailResponse = await sendEmail(
                    calldata,
                    customer,
                    branchName,
                    username,
                    emailsend
                  )

                  if (emailResponse) {
                    return res.status(200).json({
                      success: true,
                      message: "Call registered"
                    })
                  } else {
                    return res
                      .status(200)
                      .json({ message: "Call registered email not send" })
                  }
                }
              } else if (calldata.formdata.status === "solved") {
                const mapAndCheckAttendedBy = (data, selectedId) => {
                  //  Count how many times callerId matches selectedId
                  const matchCount = data.formdata.attendedBy.filter(
                    (attendee) => attendee?.callerId?.equals(selectedId)
                  ).length

                  // Return true if matchCount >= 2, otherwise false
                  return matchCount >= 2
                }

                // Example operation
                const findMatchingDocAndCheckCallerId = (
                  updatedCall,
                  token,
                  selectedId
                ) => {
                  // Find the matching doc
                  const matchingDoc = updatedCall.callregistration.find(
                    (call) => call.timedata.token === token
                  )

                  // If a matching doc is found, call the mapAndCheckAttendedBy function
                  if (matchingDoc) {
                    const isCallerIdMatched = mapAndCheckAttendedBy(
                      matchingDoc,
                      selectedId
                    )
                    return { matchingDoc, isCallerIdMatched }
                  }

                  // Return false if no matching doc is found
                  return false
                }
                //
                const { matchingDoc, isCallerIdMatched } =
                  findMatchingDocAndCheckCallerId(
                    updatedCall,
                    token,
                    calldata?.formdata?.attendedBy?.callerId
                  )

                staffCaller.callstatus.totalCall = isCallerIdMatched
                  ? staffCaller.callstatus.totalCall
                  : staffCaller.callstatus.totalCall + 1

                staffCaller.callstatus.solvedCalls += 1

                staffCaller.callstatus.totalDuration +=
                  calldata.timedata.duration

                const saved = await staffCaller.save()
                if (saved) {
                  // const stringDoc = JSON.stringify(matchingDoc, null, 2)
                  // const parsedDoc = JSON.parse(stringDoc)

                  const processedAttendedBy = matchingDoc.formdata.attendedBy
                    .slice(0, -1)
                    .map((item) => item)

                  try {
                    const results = await updateProcessedAttendees(
                      processedAttendedBy,
                      Id
                    )

                    // Check if there are any items with a status other than "success"
                    const hasErrors = results.some(
                      (result) => result.status !== "success"
                    )

                    if (hasErrors) {
                      return res.status(207).json({
                        // 207 for multi-status response
                        message: "Update process completed with some errors",
                        results
                      })
                    } else {
                      const emailResponse = await sendEmail(
                        calldata,
                        customer,
                        branchName,
                        username,
                        emailsend
                      )
                      if (emailResponse) {
                        return res.status(200).json({
                          success: true,
                          message: "Call registered"
                        })
                      } else {
                        return res
                          .status(200)
                          .json({ message: "Call registered email not send" })
                      }
                    }
                  } catch (error) {
                    console.error("Error in updateAttendeesController:", error)
                    return res.status(500).json({
                      message: "An error occurred during the update process",
                      error: error.message
                    })
                  }
                }
              }
            } else {
              const adminCaller = await Admin.findOne({
                _id: Id
              })
              if (adminCaller) {
                if (calldata.formdata.status === "pending") {
                  adminCaller.callstatus.totalCall += 1

                  adminCaller.callstatus.pendingCalls += 1

                  adminCaller.callstatus.totalDuration +=
                    calldata.timedata.duration

                  const pendingAdminSaved = await adminCaller.save()
                  if (pendingAdminSaved) {
                    const emailResponse = await sendEmail(
                      calldata,
                      customer,
                      branchName,
                      username,
                      emailsend
                    )

                    if (emailResponse) {
                      return res.status(200).json({
                        success: true,
                        message: "Call registered"
                      })
                    } else {
                      return res
                        .status(200)
                        .json({ message: "Call registered email not send" })
                    }
                  }
                } else if (calldata.formdata.status === "solved") {
                  const mapAndCheckAttendedBy = (data, selectedId) => {
                    // Count how many times callerId matches selectedId
                    const matchCount = data.formdata.attendedBy.filter(
                      (attendee) => attendee.callerId.equals(selectedId)
                    ).length
                    // Return true if matchCount >= 2, otherwise false
                    return matchCount >= 2
                  }

                  // Example operation
                  const findMatchingDocAndCheckCallerId = (
                    updatedCall,
                    token,
                    selectedId
                  ) => {
                    // Find the matching doc
                    const matchingDoc = updatedCall.callregistration.find(
                      (call) => call?.timedata?.token === token
                    )

                    // If a matching doc is found, call the mapAndCheckAttendedBy function
                    if (matchingDoc) {
                      const isCallerIdMatched = mapAndCheckAttendedBy(
                        matchingDoc,
                        selectedId
                      )
                      return { matchingDoc, isCallerIdMatched }
                    }

                    // Return false if no matching doc is found
                    return false
                  }
                  //
                  const { matchingDoc, isCallerIdMatched } =
                    findMatchingDocAndCheckCallerId(
                      updatedCall,
                      token,
                      calldata?.formdata?.attendedBy?.callerId
                    )
                  //

                  adminCaller.callstatus.totalCall = isCallerIdMatched
                    ? adminCaller.callstatus.totalCall
                    : adminCaller.callstatus.totalCall + 1

                  adminCaller.callstatus.solvedCalls += 1

                  adminCaller.callstatus.totalDuration +=
                    calldata.timedata.duration

                  const saved = await adminCaller.save()
                  if (saved) {
                    const processedAttendedBy = matchingDoc.formdata.attendedBy
                      .slice(0, -1)
                      .map((item) => item)

                    try {
                      const results = await updateProcessedAttendees(
                        processedAttendedBy,
                        Id
                      )

                      // Check if there are any items with a status other than "success"
                      const hasErrors = results.some(
                        (result) => result.status !== "success"
                      )

                      if (hasErrors) {
                        return res.status(207).json({
                          // 207 for multi-status response
                          message: "Update process completed with some errors",
                          results
                        })
                      } else {
                        const emailResponse = await sendEmail(
                          calldata,
                          customer,
                          branchName,
                          username,
                          emailsend
                        )
                        if (emailResponse) {
                          return res.status(200).json({
                            success: true,
                            message: "Call registered"
                          })
                        } else {
                          return res
                            .status(200)
                            .json({ message: "Call registered email not send" })
                        }
                      }
                    } catch (error) {
                      console.error(
                        "Error in updateAttendeesController:",
                        error
                      )
                      return res.status(500).json({
                        message: "An error occurred during the update process",
                        error: error.message
                      })
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        const isTokenUsed = await CallRegistration.findOne({
          "callregistration.timedata.token": calldata.timedata.token
        });

        if (isTokenUsed) {
          const newToken = generateUniqueNumericToken()
          const isAgainUsed = await CallRegistration.findOne({
            "callregistration.timedata.token": newToken
          })
          if (isAgainUsed) {

            throw new Error("Token already exists"); // ⛔ Execution jumps to catch block here

          } else {
            calldata.timedata.token = newToken
          }


        }
        // console.log("calldata", calldata)
        user.callregistration.push(calldata)
        const updatedCall = await user.save()
        const Id = calldata.formdata.attendedBy.callerId

        if (updatedCall) {
          const staffCaller = await Staff.findOne({
            _id: Id
          })

          if (staffCaller) {
            if (calldata.formdata.status === "pending") {
              staffCaller.callstatus.totalCall += 1

              staffCaller.callstatus.pendingCalls += 1

              staffCaller.callstatus.totalDuration += calldata.timedata.duration

              const pendingSavedStaff = await staffCaller.save()
              if (pendingSavedStaff) {
                const emailResponse = await sendEmail(
                  calldata,
                  customer,
                  branchName,
                  username,
                  emailsend
                )
                if (emailResponse) {
                  return res.status(200).json({
                    success: true,
                    message: "Call registered"
                  })
                } else {
                  return res
                    .status(200)
                    .json({ message: "Call registered email not send" })
                }
              }
            } else if (calldata.formdata.status === "solved") {
              staffCaller.callstatus.totalCall += 1

              staffCaller.callstatus.solvedCalls += 1

              staffCaller.callstatus.totalDuration += calldata.timedata.duration

              const saved = await staffCaller.save()
              if (saved) {
                const emailResponse = await sendEmail(
                  calldata,
                  customer,
                  branchName,
                  username,
                  emailsend
                )
                if (emailResponse) {
                  return res.status(200).json({
                    success: true,
                    message: "Call registered"
                  })
                } else {
                  return res
                    .status(200)
                    .json({ message: "Call registered email not send" })
                }
              }
            }
          } else {
            const adminCaller = await Admin.findOne({
              _id: Id
            })
            if (adminCaller) {
              if (calldata.formdata.status === "pending") {
                adminCaller.callstatus.totalCall += 1

                adminCaller.callstatus.pendingCalls += 1

                adminCaller.callstatus.totalDuration +=
                  calldata.timedata.duration

                const pendingAdminSaved = await adminCaller.save()
                if (pendingAdminSaved) {
                  const emailResponse = await sendEmail(
                    calldata,
                    customer,
                    branchName,
                    emailsend
                  )
                  if (emailResponse) {
                    return res.status(200).json({
                      success: true,
                      message: "Call registered"
                    })
                  } else {
                    return res
                      .status(200)
                      .json({ message: "Call registered email not send" })
                  }
                }
              } else if (calldata.formdata.status === "solved") {
                adminCaller.callstatus.totalCall += 1

                adminCaller.callstatus.solvedCalls += 1

                adminCaller.callstatus.totalDuration +=
                  calldata.timedata.duration

                const saved = await adminCaller.save()
                if (saved) {
                  const emailResponse = await sendEmail(
                    calldata,
                    customer,
                    branchName,
                    username,
                    emailsend
                  )

                  if (emailResponse) {
                    return res.status(200).json({
                      success: true,
                      message: "Call registered"
                    })
                  } else {
                    return res
                      .status(200)
                      .json({ message: "Call registered email not send" })
                  }
                }
              }
            }
          }
        }
      }
    } else {
      const isTokenUsed = await CallRegistration.findOne({
        "callregistration.timedata.token": calldata.timedata.token
      });

      if (isTokenUsed) {
        const newToken = generateUniqueNumericToken()
        const isAgainUsed = await CallRegistration.findOne({
          "callregistration.timedata.token": newToken
        })
        if (isAgainUsed) {

          throw new Error("Token already exists"); // ⛔ Execution jumps to catch block here

        } else {
          calldata.timedata.token = newToken
        }


      }
      //If no document is found, create a new one with the given call data
      const newCall = new CallRegistration({
        customerid: customerId,
        customerName: customer,
        callregistration: [calldata] // Wrap calldata in an array
      })

      // Save the new document
      const updatedCall = await newCall.save()
      if (updatedCall) {
        const Id = calldata.formdata.attendedBy.callerId

        const staffCaller = await Staff.findOne({
          _id: Id
        })

        if (staffCaller) {
          if (calldata.formdata.status === "pending") {
            staffCaller.callstatus.totalCall += 1

            staffCaller.callstatus.pendingCalls += 1

            staffCaller.callstatus.totalDuration += calldata.timedata.duration

            const pendingSavedStaff = await staffCaller.save()

            if (pendingSavedStaff) {
              const emailResponse = await sendEmail(
                calldata,
                customer,
                branchName,
                username,
                emailsend
              )

              if (emailResponse) {
                return res.status(200).json({
                  success: true,
                  message: "Call registered"
                })
              } else {
                return res
                  .status(200)
                  .json({ message: "Call registered email not send" })
              }
            }
          } else if (calldata.formdata.status === "solved") {
            staffCaller.callstatus.totalCall += 1

            staffCaller.callstatus.solvedCalls += 1

            staffCaller.callstatus.totalDuration += calldata.timedata.duration

            const saved = await staffCaller.save()
            if (saved) {
              const emailResponse = await sendEmail(
                calldata,
                customer,
                branchName,
                username,
                emailsend
              )
              if (emailResponse) {
                return res.status(200).json({
                  success: true,
                  message: "Call registered"
                })
              } else {
                return res
                  .status(200)
                  .json({ message: "Call registered email not send" })
              }
            }
          }
        } else {
          const adminCaller = await Admin.findOne({
            _id: Id
          })
          if (adminCaller) {
            if (calldata.formdata.status === "pending") {
              adminCaller.callstatus.totalCall += 1

              adminCaller.callstatus.pendingCalls += 1

              adminCaller.callstatus.totalDuration += calldata.timedata.duration

              const pendingAdminSaved = await adminCaller.save()
              if (pendingAdminSaved) {
                const emailResponse = await sendEmail(
                  calldata,
                  customer,
                  branchName,
                  username,
                  emailsend
                )
                if (emailResponse) {
                  return res.status(200).json({
                    success: true,
                    message: "Call registered"
                  })
                } else {
                  return res
                    .status(200)
                    .json({ message: "Call registered email not send" })
                }
              }
            } else if (calldata.formdata.status === "solved") {
              adminCaller.callstatus.totalCall += 1

              adminCaller.callstatus.solvedCalls += 1

              adminCaller.callstatus.totalDuration += calldata.timedata.duration

              const saved = await adminCaller.save()
              if (saved) {
                const emailResponse = await sendEmail(
                  calldata,
                  customer,
                  branchName,
                  username,
                  emailsend
                )
                if (emailResponse) {
                  return res.status(200).json({
                    success: true,
                    message: "Call registered"
                  })
                } else {
                  return res
                    .status(200)
                    .json({ message: "Call registered email not send" })
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error saving or updating call registration:", error.message)
    return res.status(500).json({
      status: false,
      message: "Error saving or updating call registration"
    })
  }
}
const updateProcessedAttendees = async (processedAttendedBy, attendedId) => {
  const updateResults = []

  // Helper function to update call status
  const updateCallStatus = async (user, callerId) => {
    user.callstatus.pendingCalls -= 1
    user.callstatus.colleagueSolved = callerId.equals(attendedId)
      ? user.callstatus.colleagueSolved
      : user.callstatus.colleagueSolved + 1

    // Save the updated document
    await user.save()
  }

  for (const item of processedAttendedBy) {
    const { callerId } = item

    try {
      // Try finding staff with the given callerId
      let user = await Staff.findOne({ _id: callerId })

      // If not found in Staff, search in Admin
      if (!user) {
        user = await Admin.findOne({ _id: callerId })
      }

      // If either staff or admin is found, update their call status
      if (user) {
        const a = await updateCallStatus(user, callerId)

        // Record success status for this item
        updateResults.push({ callerId, status: "success" })
      } else {
        // Record not found status if neither staff nor admin is found
        updateResults.push({ callerId, status: "not found" })
      }
    } catch (error) {
      console.error(`Error updating call status for ${callerId}:`, error)
      // Record error status for this item
      updateResults.push({ callerId, status: "error", error: error.message })
    }
  }

  // Return the final status after all updates
  return updateResults
}

export const loggeduserCallsCurrentDateCalls = async (req, res) => {
  try {
    const { loggedUserId } = req.query
    const loggeduserObjectId = new mongoose.Types.ObjectId(loggedUserId)
    const today = new Date()

    const startOfDayStr = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDayStr = new Date(today.setHours(23, 59, 59, 999)).toISOString()
    // Build the initial match condition that always includes the user ID

    const pipeline = [
      // Match customers who have calls attended by the logged user today
      {
        $match: {
          callregistration: {
            $elemMatch: {
              "formdata.attendedBy": {
                $elemMatch: {
                  callerId: loggeduserObjectId,
                  calldate: { $gte: startOfDayStr, $lte: endOfDayStr }
                }
              }
            }
          }
        }
      },
      // Unwind the callregistration array to process each call
      {
        $unwind: {
          path: "$callregistration",
          preserveNullAndEmptyArrays: false
        }
      },
      // Filter to keep only calls that were attended by the logged user today
      {
        $match: {
          "callregistration.formdata.attendedBy": {
            $elemMatch: {
              callerId: loggeduserObjectId,
              calldate: { $gte: startOfDayStr, $lte: endOfDayStr }
            }
          }
        }
      },
      // Lookup product details
      {
        $lookup: {
          from: "products",
          localField: "callregistration.product",
          foreignField: "_id",
          as: "callregistration.productDetails"
        }
      },
      {
        $addFields: {
          "callregistration.productDetails": {
            $map: {
              input: "$callregistration.productDetails",
              as: "product",
              in: { productName: "$$product.productName" }
            }
          }
        }
      },
      // Lookup completedBy staff details
      {
        $lookup: {
          from: "staffs",
          localField: "callregistration.formdata.completedBy.callerId",
          foreignField: "_id",
          as: "completedByDetails"
        }
      },
      {
        $addFields: {
          "callregistration.formdata.completedBy.name": {
            $arrayElemAt: ["$completedByDetails.name", 0]
          }
        }
      },
      // Lookup attendedBy staff details
      {
        $lookup: {
          from: "staffs",
          let: { attendedByArray: "$callregistration.formdata.attendedBy" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$attendedByArray.callerId"]
                }
              }
            },
            { $project: { _id: 1, name: 1 } }
          ],
          as: "attendedByStaff"
        }
      },
      // Add staff names to attendedBy entries
      {
        $addFields: {
          "callregistration.formdata.attendedBy": {
            $map: {
              input: "$callregistration.formdata.attendedBy",
              as: "attended",
              in: {
                $mergeObjects: [
                  "$$attended",
                  {
                    name: {
                      $let: {
                        vars: {
                          staff: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$attendedByStaff",
                                  as: "staff",
                                  cond: {
                                    $eq: ["$$staff._id", "$$attended.callerId"]
                                  }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: "$$staff.name"
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      // Group by customer ID to consolidate calls
      {
        $group: {
          _id: "$_id",
          customerid: { $first: "$customerid" },
          customerName: { $first: "$customerName" },
          callregistration: { $push: "$callregistration" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" }
        }
      }
    ]

    const currentDateloggedusercalls = await CallRegistration.aggregate(
      pipeline
    )

    return res
      .status(200)
      .json({ message: "found", data: currentDateloggedusercalls })
  } catch (error) {
    console.log("error:", error.message)
    return res.status(500).json({ message: "Internal server error" })
  }
}
export const GetCallRegister = async (req, res) => {
  try {
    const { customerid } = req.query

    const { callId } = req.params

    if (customerid !== "null" && customerid) {
      const customerId = new mongoose.Types.ObjectId(customerid)
      const registeredCall = await CallRegistration.findOne({
        customerid: customerId
      }).populate({ path: "callregistration.product", select: "productName shortName productorservicetype" })

      const attendedByIds = new Set()
      const completedByIds = new Set()
      registeredCall.callregistration.map((entry) => {
        // Handle `attendedBy`
        const attendedBy = entry.formdata.attendedBy
        if (Array.isArray(attendedBy)) {
          // If it's an array, iterate over it
          attendedBy.forEach((attendee) => {
            if (attendee.callerId) {
              attendedByIds.add(attendee.callerId.toString())
            } else if (attendee.name) {
              attendedByIds.add(attendee.name)
            }
          })
        } else if (typeof attendedBy === "string") {
          // If it's a string, add it directly
          attendedByIds.add(attendedBy)
        }

        // Handle `completedBy`
        const completedBy = entry.formdata.completedBy
        if (Array.isArray(completedBy) && completedBy.length > 0) {
          const completedByEntry = completedBy[0]
          if (completedByEntry.callerId) {
            completedByIds.add(completedByEntry.callerId.toString())
          } else if (completedByEntry.name) {
            completedByIds.add(completedByEntry.name)
            // Optionally, handle cases where only the name exists
            console.warn(
              `CompletedBy has name but no callerId: ${completedByEntry.name}`
            )
          }
        } else if (typeof completedBy === "string") {
          // If it's a string, add it directly
          completedByIds.add(completedBy)
        }
      })

      // Separate IDs and names from the Sets
      const attendedByIdsArray = Array.from(attendedByIds)
      const attendedByObjectIds = attendedByIdsArray.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      )

      const attendedByNames = attendedByIdsArray
        .filter((id) => !mongoose.Types.ObjectId.isValid(id)) // Filter invalid ObjectIds (names)
        .map((name) => ({ name })) // Transform them into objects with a "name" property

      const completedByIdsArray = Array.from(completedByIds)
      const completedByObjectIds = completedByIdsArray.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      )

      const completedByNames = completedByIdsArray
        .filter((id) => !mongoose.Types.ObjectId.isValid(id)) // Filter invalid ObjectIds (names)
        .map((name) => ({ name })) // Transform them into objects with a "name" property
      // Query for ObjectIds (staff/admin users)
      const [
        attendedByStaff,
        attendedByAdmin,
        completedByStaff,
        completedByAdmin
      ] = await Promise.all([
        // Search attendedBy IDs in Staff
        mongoose
          .model("Staff")
          .find({ _id: { $in: attendedByObjectIds } })
          .select("name _id ")
          .lean(),

        // Search attendedBy IDs in Admin
        mongoose
          .model("Admin")
          .find({ _id: { $in: attendedByObjectIds } })
          .select("name _id ")
          .lean(),

        // Search completedBy IDs in Staff
        mongoose
          .model("Staff")
          .find({ _id: { $in: completedByObjectIds } })
          .select("name _id ")
          .lean(),

        // Search completedBy IDs in Admin
        mongoose
          .model("Admin")
          .find({ _id: { $in: completedByObjectIds } })
          .select("name _id ")
          .lean()
      ])

      // Combine results for attendedBy and completedBy
      const attendedByUsers = [...attendedByStaff, ...attendedByAdmin]
      const completedByUsers = [...completedByStaff, ...completedByAdmin]

      // Optionally handle name-based entries as well
      const attendedByCombined = [...attendedByUsers, ...attendedByNames]

      const completedByCombined = [...completedByUsers, ...completedByNames]
      const userMap = new Map(
        [...attendedByCombined, ...completedByCombined].map((user) => [
          user._id ? user._id.toString() : user.name,
          user.name
        ])
      )

      registeredCall.callregistration.forEach((entry) => {
        // Handle attendedBy field
        if (Array.isArray(entry?.formdata?.attendedBy)) {
          entry.formdata.attendedBy = entry.formdata.attendedBy
            .flat() // Flatten the array
            .map((attendee) => {
              const name = userMap.get(attendee?.callerId?.toString())
              // If name is found, attach it to the callerId
              return name ? { ...attendee, callerId: { name } } : attendee // Keep original if no name found
            })
        } else if (typeof entry?.formdata?.attendedBy === "string") {
          // If attendedBy is a string (not an array), map it to the name if it exists in userMap
          const name = userMap.get(entry?.formdata?.attendedBy)
          entry.formdata.attendedBy = name
            ? { callerId: { name } } // Map the string to an object with a name
            : { callerId: entry?.formdata?.attendedBy } // Keep the original if no name found
        }

        // Handle completedBy field
        if (
          Array.isArray(entry?.formdata?.completedBy) &&
          entry?.formdata?.completedBy.length > 0
        ) {
          // If completedBy is an array, map over each entry (assuming one entry)
          const completedUser = userMap.get(
            entry?.formdata?.completedBy[0]?.callerId?.toString()
          )
          entry.formdata.completedBy = completedUser
            ? [{ ...entry?.formdata?.completedBy[0], name: completedUser }] // Add the name to the first item
            : entry.formdata.completedBy // Keep as is if no name found
        } else if (typeof entry?.formdata?.completedBy === "string") {
          // If completedBy is a string, map it to the name if it exists in userMap
          const name = userMap.get(entry?.formdata?.completedBy)
          entry.formdata.completedBy = name
            ? { callerId: { name } } // Map the string to an object with a name
            : { callerId: entry?.formdata?.completedBy } // Keep the original if no name found
        }
      })
      if (registeredCall) {
        return res
          .status(200)
          .json({ message: "registered call found", data: registeredCall })
      } else {
        return res.status(404).json({ message: "No registered Calls" })
      }
    } else if (callId) {
      // console.log("callid",callId)
      const callDetails = await CallRegistration.findById(callId)
        .populate({
          path: "customerid",
          populate: [
            {
              path: "partner",
              model: "Partner" // optional if ref is defined in schema
            },
            {
              path: "selected.company_id",
              model: "Company"
            },
            {
              path: "selected.branch_id",
              model: "Branch"
            },
            {
              path: "selected.product_id",
              model: "Product"
            }
          ]
        }).populate({
          path: "callregistration.product", // Populate the product field inside callregistration array
          model: "Product"
        })
        .populate({ path: "callregistration.formdata.callnote" })
      // console.log("calldetails", callDetails)

      const attendedByIds = new Set()
      const completedByIds = new Set()
      callDetails.callregistration.map((entry) => {
        // Handle `attendedBy`
        const attendedBy = entry.formdata.attendedBy
        if (Array.isArray(attendedBy)) {
          // If it's an array, iterate over it
          attendedBy.forEach((attendee) => {
            if (attendee.callerId) {
              attendedByIds.add(attendee.callerId.toString())
            } else if (attendee.name) {
              attendedByIds.add(attendee.name)
            }
          })
        } else if (typeof attendedBy === "string") {
          // If it's a string, add it directly
          attendedByIds.add(attendedBy)
        }

        // Handle `completedBy`
        const completedBy = entry.formdata.completedBy
        if (Array.isArray(completedBy) && completedBy.length > 0) {
          const completedByEntry = completedBy[0]
          if (completedByEntry.callerId) {
            completedByIds.add(completedByEntry.callerId.toString())
          } else if (completedByEntry.name) {
            completedByIds.add(completedByEntry.name)
            // Optionally, handle cases where only the name exists
            console.warn(
              `CompletedBy has name but no callerId: ${completedByEntry.name}`
            )
          }
        } else if (typeof completedBy === "string") {
          // If it's a string, add it directly
          completedByIds.add(completedBy)
        }
      })

      // Separate IDs and names from the Sets
      const attendedByIdsArray = Array.from(attendedByIds)
      const attendedByObjectIds = attendedByIdsArray.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      )

      const attendedByNames = attendedByIdsArray
        .filter((id) => !mongoose.Types.ObjectId.isValid(id)) // Filter invalid ObjectIds (names)
        .map((name) => ({ name })) // Transform them into objects with a "name" property

      const completedByIdsArray = Array.from(completedByIds)
      const completedByObjectIds = completedByIdsArray.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      )

      const completedByNames = completedByIdsArray
        .filter((id) => !mongoose.Types.ObjectId.isValid(id)) // Filter invalid ObjectIds (names)
        .map((name) => ({ name })) // Transform them into objects with a "name" property

      // Query for ObjectIds (staff/admin users)
      const [
        attendedByStaff,
        attendedByAdmin,
        completedByStaff,
        completedByAdmin
      ] = await Promise.all([
        // Search attendedBy IDs in Staff
        mongoose
          .model("Staff")
          .find({ _id: { $in: attendedByObjectIds } })
          .select("name _id ")
          .lean(),

        // Search attendedBy IDs in Admin
        mongoose
          .model("Admin")
          .find({ _id: { $in: attendedByObjectIds } })
          .select("name _id ")
          .lean(),

        // Search completedBy IDs in Staff
        mongoose
          .model("Staff")
          .find({ _id: { $in: completedByObjectIds } })
          .select("name _id ")
          .lean(),

        // Search completedBy IDs in Admin
        mongoose
          .model("Admin")
          .find({ _id: { $in: completedByObjectIds } })
          .select("name _id ")
          .lean()
      ])

      // Combine results for attendedBy and completedBy
      const attendedByUsers = [...attendedByStaff, ...attendedByAdmin]
      const completedByUsers = [...completedByStaff, ...completedByAdmin]

      // Optionally handle name-based entries as well
      const attendedByCombined = [...attendedByUsers, ...attendedByNames]

      const completedByCombined = [...completedByUsers, ...completedByNames]
      const userMap = new Map(
        [...attendedByCombined, ...completedByCombined].map((user) => [
          user._id ? user._id.toString() : user.name,
          user.name
        ])
      )

      callDetails.callregistration.forEach((entry) => {
        // Handle attendedBy field
        if (Array.isArray(entry?.formdata?.attendedBy)) {
          entry.formdata.attendedBy = entry.formdata.attendedBy
            .flat() // Flatten the array
            .map((attendee) => {
              const name = userMap.get(attendee?.callerId?.toString())
              // If name is found, attach it to the callerId
              return name ? { ...attendee, callerId: { name } } : attendee // Keep original if no name found
            })
        } else if (typeof entry?.formdata?.attendedBy === "string") {
          // If attendedBy is a string (not an array), map it to the name if it exists in userMap
          const name = userMap.get(entry?.formdata?.attendedBy)
          entry.formdata.attendedBy = name
            ? { callerId: { name } } // Map the string to an object with a name
            : { callerId: entry?.formdata?.attendedBy } // Keep the original if no name found
        }

        // Handle completedBy field
        if (
          Array.isArray(entry?.formdata?.completedBy) &&
          entry?.formdata?.completedBy.length > 0
        ) {
          // If completedBy is an array, map over each entry (assuming one entry)
          const completedUser = userMap.get(
            entry?.formdata?.completedBy[0]?.callerId?.toString()
          )
          entry.formdata.completedBy = completedUser
            ? [{ ...entry?.formdata?.completedBy[0], name: completedUser }] // Add the name to the first item
            : entry.formdata.completedBy // Keep as is if no name found
        } else if (typeof entry?.formdata?.completedBy === "string") {
          // If completedBy is a string, map it to the name if it exists in userMap
          const name = userMap.get(entry?.formdata?.completedBy)
          entry.formdata.completedBy = name
            ? { callerId: { name } } // Map the string to an object with a name
            : { callerId: entry?.formdata?.completedBy } // Keep the original if no name found
        }
      })
      if (!callDetails) {
        return res.status(404).json({ message: "Calls not found" })
      } else {
        return res
          .status(200)
          .json({ message: "calls with respect customer found", callDetails })
      }

      // Send the call details as a response
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: "internal server error" })
  }
}
export const GetAllExpiryRegister = async (req, res) => {
  const { nextmonthReport, startDate, endDate, filterType = "all", productId } = req.query

  console.log("filtertype", filterType)
  console.log("startdate", startDate)
  console.log("enddate", endDate)
  console.log("productId", productId)
  try {
    let startOfNextMonth
    let endOfNextMonth

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (nextmonthReport) {
      startOfNextMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        1
      )

      endOfNextMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 2,
        0
      )

      endOfNextMonth.setHours(23, 59, 59, 999)
    }

    const dateFilter = nextmonthReport
      ? { $gte: startOfNextMonth, $lte: endOfNextMonth }
      : { $gte: new Date(startDate), $lte: new Date(endDate) }

    const selectedProductId =
      productId && mongoose.Types.ObjectId.isValid(productId)
        ? new mongoose.Types.ObjectId(productId)
        : null

    let elemMatch = {}

    switch (filterType) {
      case "amc":
        elemMatch = {
          amcendDate: dateFilter
        }
        break

      case "tuv":
        elemMatch = {
          tvuexpiryDate: dateFilter
        }
        break

      case "license":
        elemMatch = {
          licenseExpiryDate: dateFilter
        }
        break

      case "latest":
      case "product":
        elemMatch = {
          ...(selectedProductId ? { product_id: selectedProductId } : {}),
          $or: [
            { nextDue: dateFilter },
            { taggeddata: { $elemMatch: { nextDue: dateFilter } } }
          ]
        }
        break

      default:
        elemMatch = {
          $or: [
            { licenseExpiryDate: dateFilter },
            { tvuexpiryDate: dateFilter },
            { amcendDate: dateFilter },
            { nextDue: dateFilter },
            { "taggeddata.nextDue": dateFilter }
          ]
        }
    }

    const customers = await Customer.find({
      selected: {
        $elemMatch: elemMatch
      }
    }).populate({
      path: "selected.product_id",
      select: "shortName productName productorservicetype"
    })

    const expiredCustomers = customers.map((customer) => {
      const selected = customer.selected
        .filter((item) => {
          switch (filterType) {
            case "amc":
              return (
                item.amcendDate &&
                item.amcendDate >= dateFilter.$gte &&
                item.amcendDate <= dateFilter.$lte
              )

            case "tuv":
              return (
                item.tvuexpiryDate &&
                item.tvuexpiryDate >= dateFilter.$gte &&
                item.tvuexpiryDate <= dateFilter.$lte
              )

            case "license":
              return (
                item.licenseExpiryDate &&
                item.licenseExpiryDate >= dateFilter.$gte &&
                item.licenseExpiryDate <= dateFilter.$lte
              )

            case "latest":
            case "product":
              return (
                (item.nextDue &&
                  item.nextDue >= dateFilter.$gte &&
                  item.nextDue <= dateFilter.$lte) ||
                item.taggeddata?.some(
                  (tag) =>
                    tag.nextDue &&
                    tag.nextDue >= dateFilter.$gte &&
                    tag.nextDue <= dateFilter.$lte
                )
              ) &&
                (!selectedProductId ||
                  String(item.product_id?._id || item.product_id) ===
                  String(selectedProductId))

            default:
              return (
                (item.licenseExpiryDate &&
                  item.licenseExpiryDate >= dateFilter.$gte &&
                  item.licenseExpiryDate <= dateFilter.$lte) ||
                (item.tvuexpiryDate &&
                  item.tvuexpiryDate >= dateFilter.$gte &&
                  item.tvuexpiryDate <= dateFilter.$lte) ||
                (item.amcendDate &&
                  item.amcendDate >= dateFilter.$gte &&
                  item.amcendDate <= dateFilter.$lte) ||
                (item.nextDue &&
                  item.nextDue >= dateFilter.$gte &&
                  item.nextDue <= dateFilter.$lte) ||
                item.taggeddata?.some(
                  (tag) =>
                    tag.nextDue &&
                    tag.nextDue >= dateFilter.$gte &&
                    tag.nextDue <= dateFilter.$lte
                )
              )
          }
        })
        .map((item) => {
          const obj = item.toObject ? item.toObject() : { ...item }

          if (filterType === "amc") {
            delete obj.licenseExpiryDate
            delete obj.tvuexpiryDate
          } else if (filterType === "tuv") {
            delete obj.licenseExpiryDate
            delete obj.amcendDate
          } else if (filterType === "license") {
            delete obj.tvuexpiryDate
            delete obj.amcendDate
          } else if (filterType === "latest" || filterType === "product") {
            delete obj.licenseExpiryDate
            delete obj.tvuexpiryDate
            delete obj.amcendDate
          }

          if (
            filterType === "latest" ||
            filterType === "product" ||
            filterType === "all"
          ) {
            obj.taggeddata = (obj.taggeddata || []).filter(
              (tag) =>
                tag.nextDue &&
                tag.nextDue >= dateFilter.$gte &&
                tag.nextDue <= dateFilter.$lte
            )
          }

          return obj
        })

      return {
        ...customer.toObject(),
        selected
      }
    })

    if (expiredCustomers.length > 0) {
      return res.status(200).json({
        message: "Customers found with expiry",
        data: expiredCustomers
      })
    }

    return res.status(404).json({
      message: "No customers with expired Dates",
      data: []
    })
  } catch (error) {
    console.log("error:", error.message)
    return res.status(500).json({
      message: "Internal server error"
    })
  }
}


export const getallExpiredCustomerCalls = async (req, res) => {
  try {
    const { startDate, endDate, isAdmin, userBranchId } = req.body

    const userBranchIds = userBranchId.map((id) => new mongoose.Types.ObjectId(id))

    const expiredCustomers = await Customer.find({
      selected: {
        $elemMatch: {
          ...(isAdmin ? {} : { branch_id: { $in: userBranchIds } }), // only include branch filter if not admin
          $or: [
            {
              licenseExpiryDate: { $gte: startDate, $lte: endDate }
            }, // License expiry in the past
            {
              tvuexpiryDate: { $gte: startDate, $lte: endDate }
            }, // TVU expiry in the past
            {
              amcendDate: { $gte: startDate, $lte: endDate }
            }, // AMC end in the past
            {
              "taggeddata.nextDue": { $gte: startDate, $lte: endDate }
            } // Latest expiry in the past
          ]
        }
      }
    })
    // console.log("expiredcustomere", expiredCustomers.length)
    const expiredCustomerIds = expiredCustomers.map((customer) => customer._id)
    const calls = await CallRegistration.find({
      customerid: { $in: expiredCustomerIds } // Assuming 'customerId' field in CallRegistration matches customer IDs
    })
      .populate([
        {
          path: "callregistration.product",
          select: "productName"
        },
        {
          path: "customerid",
          select: "customerName"
        }
      ])
      .lean()

    const attendedByIds = new Set()
    const completedByIds = new Set()

    calls.forEach((call) =>
      call.callregistration.forEach((entry) => {
        // Handle `attendedBy`
        const attendedBy = entry.formdata.attendedBy
        if (Array.isArray(attendedBy)) {
          // If it's an array, iterate over it
          attendedBy.forEach((attendee) => {
            if (attendee.callerId) {
              attendedByIds.add(attendee.callerId.toString())
            } else if (attendee.name) {
              attendedByIds.add(attendee.name)
            }
          })
        } else if (typeof attendedBy === "string") {
          // If it's a string, add it directly
          attendedByIds.add(attendedBy)
        }

        // Handle `completedBy`
        const completedBy = entry.formdata.completedBy
        if (Array.isArray(completedBy) && completedBy.length > 0) {
          const completedByEntry = completedBy[0]
          if (completedByEntry.callerId) {
            completedByIds.add(completedByEntry.callerId.toString())
          } else if (completedByEntry.name) {
            completedByIds.add(completedByEntry.name)
            // Optionally, handle cases where only the name exists
            console.warn(
              `CompletedBy has name but no callerId: ${completedByEntry.name}`
            )
          }
        } else if (typeof completedBy === "string") {
          // If it's a string, add it directly
          completedByIds.add(completedBy)
        }
      })
    )

    // Separate IDs and names from the Sets
    const attendedByIdsArray = Array.from(attendedByIds)
    const attendedByObjectIds = attendedByIdsArray.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    )

    const attendedByNames = attendedByIdsArray
      .filter((id) => !mongoose.Types.ObjectId.isValid(id)) // Filter invalid ObjectIds (names)
      .map((name) => ({ name })) // Transform them into objects with a "name" property

    const completedByIdsArray = Array.from(completedByIds)
    const completedByObjectIds = completedByIdsArray.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    )

    const completedByNames = completedByIdsArray
      .filter((id) => !mongoose.Types.ObjectId.isValid(id)) // Filter invalid ObjectIds (names)
      .map((name) => ({ name })) // Transform them into objects with a "name" property

    // Query for ObjectIds (staff/admin users)
    const [
      attendedByStaff,
      attendedByAdmin,
      completedByStaff,
      completedByAdmin
    ] = await Promise.all([
      // Search attendedBy IDs in Staff
      mongoose
        .model("Staff")
        .find({ _id: { $in: attendedByObjectIds } })
        .select("name _id ")
        .lean(),

      // Search attendedBy IDs in Admin
      mongoose
        .model("Admin")
        .find({ _id: { $in: attendedByObjectIds } })
        .select("name _id ")
        .lean(),

      // Search completedBy IDs in Staff
      mongoose
        .model("Staff")
        .find({ _id: { $in: completedByObjectIds } })
        .select("name _id ")
        .lean(),

      // Search completedBy IDs in Admin
      mongoose
        .model("Admin")
        .find({ _id: { $in: completedByObjectIds } })
        .select("name _id ")
        .lean()
    ])

    // Combine results for attendedBy and completedBy
    const attendedByUsers = [...attendedByStaff, ...attendedByAdmin]
    const completedByUsers = [...completedByStaff, ...completedByAdmin]

    // Optionally handle name-based entries as well
    const attendedByCombined = [...attendedByUsers, ...attendedByNames]

    const completedByCombined = [...completedByUsers, ...completedByNames]
    const userMap = new Map(
      [...attendedByCombined, ...completedByCombined].map((user) => [
        user._id ? user._id.toString() : user.name,
        user.name
      ])
    )

    calls.forEach((call) =>
      call.callregistration.forEach((entry) => {
        // Handle attendedBy field
        if (Array.isArray(entry?.formdata?.attendedBy)) {
          entry.formdata.attendedBy = entry.formdata.attendedBy
            .flat() // Flatten the array
            .map((attendee) => {
              const name = userMap.get(attendee?.callerId?.toString())
              // If name is found, attach it to the callerId
              return name ? { ...attendee, callerId: { name } } : attendee // Keep original if no name found
            })
        } else if (typeof entry?.formdata?.attendedBy === "string") {
          // If attendedBy is a string (not an array), map it to the name if it exists in userMap
          const name = userMap.get(entry?.formdata?.attendedBy)
          entry.formdata.attendedBy = name
            ? { callerId: { name } } // Map the string to an object with a name
            : { callerId: entry?.formdata?.attendedBy } // Keep the original if no name found
        }

        // Handle completedBy field
        if (
          Array.isArray(entry?.formdata?.completedBy) &&
          entry?.formdata?.completedBy.length > 0
        ) {
          // If completedBy is an array, map over each entry (assuming one entry)
          const completedUser = userMap.get(
            entry?.formdata?.completedBy[0]?.callerId?.toString()
          )
          entry.formdata.completedBy = completedUser
            ? [{ ...entry?.formdata?.completedBy[0], name: completedUser }] // Add the name to the first item
            : entry.formdata.completedBy // Keep as is if no name found
        } else if (typeof entry?.formdata?.completedBy === "string") {
          // If completedBy is a string, map it to the name if it exists in userMap
          const name = userMap.get(entry?.formdata?.completedBy)
          entry.formdata.completedBy = name
            ? { callerId: { name } } // Map the string to an object with a name
            : { callerId: entry?.formdata?.completedBy } // Keep the original if no name found
        }
      })
    )
    if (calls.length > 0) {
      return res
        .status(200)
        .json({ message: "Expired customer calls found", calls })
    } else {
      return res.status(404).json({ message: "No expired calls", calls: [] })
    }
  } catch (error) {
    console.log("error:", error.message)
    return res.status(500).json({ message: "Internal server error" })
  }
}
export const LeavemasterRegister = async (req, res) => {
  try {
    // Extract data from request body
    const {
      checkIn,
      checkOut,
      checkInEndAt,
      checkOutStartAt,
      lateArrival,
      privilegeleave,
      casualleave,
      sickleave,
      earlyOut,
      holyDate,
      customTextInput,

      deductSalaryMinute
    } = req.body

    const { editstate } = req.query
    const existingRecord = await Leavemaster.findOne({})
    if (existingRecord) {
      const isSame =
        existingRecord.checkIn === checkIn &&
        existingRecord.checkOut === checkOut &&
        existingRecord.checkInEndAt === checkInEndAt &&
        existingRecord.checkOutStartAt === checkOutStartAt &&
        existingRecord.lateArrival === lateArrival &&
        existingRecord.privilegeleave === privilegeleave &&
        existingRecord.casualleave === casualleave &&
        existingRecord.sickleave === sickleave &&
        existingRecord.deductSalaryMinute === deductSalaryMinute
      // Step 3: If everything is the same, don't create a new instance, just return
      if (isSame) {
        if (editstate === "true") {
          const b = await Holymaster.updateOne(
            { customTextInput }, // Find the existing record using its ID
            {
              $set: {
                holyDate,
                customTextInput
              }
            }
          )

          if (b.modifiedCount > 0) {
            return res
              .status(200)
              .json({ message: "Holiday update succesfully" })
          }
        } else {
          if (holyDate && customTextInput) {
            const year = new Date(holyDate).getFullYear()

            const a = await Holymaster.find({
              $and: [
                {
                  $expr: {
                    $eq: [{ $year: "$holyDate" }, year]
                  }
                },
                {
                  customTextInput
                }
              ]
            })

            // const a = await Holymaster.find({ holyDate })
            if (a && a.length > 0) {
              return res.status(401).json({
                message: `${customTextInput} is already registered with this Year`
              })
            } else {
              const newHoly = await Holymaster({
                holyDate,
                customTextInput,
                newField: true
              })
              await newHoly.save()
              if (newHoly) {
                return res.status(200).json({
                  message: ` ${customTextInput} is succesfully registered`
                })
              }
            }
          }
        }
      } else {
        // Step 4: If the data is different, update the existing record
        const q = await Leavemaster.updateOne(
          { _id: existingRecord._id }, // Find the existing record using its ID
          {
            $set: {
              checkIn,
              checkOut,
              checkInEndAt,
              checkOutStartAt,
              lateArrival,
              privilegeleave,
              casualleave,
              sickleave,
              earlyOut,
              deductSalaryMinute
            }
          },
          { new: true }
        )
        if (q.modifiedCount > 0) {
          return res
            .status(200)
            .json({ message: "Leave master updated succesfully", data: q })
        }
      }
    } else {
      // Create a new document
      const newTime = new Leavemaster({
        checkIn,
        checkOut,
        checkInEndAt,
        checkOutStartAt,
        lateArrival: Number(lateArrival),
        earlyOut: Number(earlyOut),

        deductSalaryMinute: Number(deductSalaryMinute)
      })

      // Save to database
      await newTime.save()
      if (holyDate && customTextInput) {
        const newHoly = await Holymaster({
          holyDate,
          customTextInput,
          newField: true
        })
        await newHoly.save()
        if (newHoly && newTime) {
          res.status(200).json({ message: "saved successfully!" })
        }
      }
      return res.status(200).json({ message: "successfully registered" })
    }
  } catch (error) {
    console.error("Error saving time data:", error)
    res.status(500).json({ error: "Failed to save time data." })
  }
}
export const GetallHoly = async (req, res) => {
  try {
    const holydata = await Holymaster.find({})
    if (holydata) {
      return res.status(200).json({ message: "holy found", data: holydata })
    }
  } catch (error) {
    console.log("error", error.message)
  }
}
export const GetallcurrentMonthHoly = async (req, res) => {
  try {
    const { currentmonth } = req.query
    const [year, month] = currentmonth.split("-").map(Number)
    const holidays = await Holymaster.find({
      holyDate: {
        $gte: new Date(year, month - 1, 1), // Start of the month
        $lt: new Date(year, month, 1) // Start of next month (excludes next month)
      }
    })

    return res.status(200).json({ message: "holyfound", data: holidays })
  } catch (error) {
    console.log("error:", error.message)
  }
}
export const Getleavemaster = async (req, res) => {
  try {
    const leaveMaster = await Leavemaster.find({})
    if (leaveMaster) {
      return res.status(200).json({ message: "Leave master found", data: leaveMaster })
    }
  } catch (error) {
    console.log("error", error.message)
  }
}
export const GeteditedCustomer = async (req, res) => {
  try {
    const { customerid } = req.query
    if (!customerid) {
      return res.status(400).json({ message: "customer id is required" })
    }
    const id = new mongoose.Types.ObjectId(customerid)
    const customer = await Customer.findById(id).populate("selected.product_id selected.company_id selected.branch_id")

    if (customer) {
      return res.status(200).json({ message: "customer found", data: customer })
    }
  } catch (error) {

    console.log("error", error.message)
  }
}


export const existsameCallnote = async (req, res) => {
  try {
    const { customerId, callNoteId } = req.query
    const customerObjectId = new mongoose.Types.ObjectId(customerId)
    // console.log("customerobjectid", customerObjectId)
    const callnoteObjectId = new mongoose.Types.ObjectId(callNoteId)
    // console.log('callnoteid', callnoteObjectId)

    // Pure existence check - FASTEST method
    const pendingCount = await CallRegistration.countDocuments({
      customerid: customerObjectId,
      "callregistration": {
        $elemMatch: {
          "formdata.status": "pending",
          "formdata.callnote": callnoteObjectId
        }
      }
    });


    const exists = pendingCount > 0;
    console.log('Exists:', exists); // This WILL return true ✅


    console.log("existsss", exists)

    return res.status(200).json({
      exists
    });
  } catch (error) {
    console.log("error:", error.message)
    return res.status(500).json({ message: "Internal server error" })
  }

}

export const Getallcallregistrationlist = async (req, res) => {
  try {
    const branchName = String(req.query.branchName || "").trim();
    // Build the current calendar day in IST.  A call at 04:00 IST is still
    // on the previous UTC date, so using a UTC midnight boundary hides it.
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(Date.now() + istOffsetMs).toISOString().slice(0, 10);
    const todayStart = new Date(`${istDate}T00:00:00.000+05:30`);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // This list intentionally contains only its four views: all pending
    // calls (which includes today's pending calls), today's solved calls,
    // and online calls.  Older solved calls must not be loaded into the UI.
    const match = { "callregistration.0": { $exists: true } };
    if (branchName) {
      match["callregistration.branchName"] = branchName;
    }

    let aggregated = await CallRegistration.aggregate([
      {
        $match: match
      },
      {
        $set: {
          callregistration: {
            $filter: {
              input: "$callregistration",
              as: "cr",
              cond: {
                $and: [
                  ...(branchName
                    ? [{ $in: [branchName, { $ifNull: ["$$cr.branchName", []] }] }]
                    : []),
                  {
                    $or: [
                      { $eq: [{ $toLower: { $ifNull: ["$$cr.formdata.status", ""] } }, "pending"] },
                      { $eq: [{ $toLower: { $ifNull: ["$$cr.formdata.status", ""] } }, "online"] },
                      {
                        $and: [
                          { $eq: [{ $toLower: { $ifNull: ["$$cr.formdata.status", ""] } }, "solved"] },
                          {
                            $anyElementTrue: {
                              $map: {
                                input: {
                                  $cond: {
                                    if: { $isArray: "$$cr.formdata.attendedBy" },
                                    then: "$$cr.formdata.attendedBy",
                                    else: {
                                      $cond: {
                                        if: { $eq: ["$$cr.formdata.attendedBy", null] },
                                        then: [],
                                        else: ["$$cr.formdata.attendedBy"]
                                      }
                                    }
                                  }
                                },
                                as: "att",
                                in: {
                                  $and: [
                                    {
                                      $gte: [
                                        {
                                          $convert: {
                                            input: "$$att.calldate",
                                            to: "date",
                                            onError: null,
                                            onNull: null
                                          }
                                        },
                                        todayStart
                                      ]
                                    },
                                    {
                                      $lt: [
                                        {
                                          $convert: {
                                            input: "$$att.calldate",
                                            to: "date",
                                            onError: null,
                                            onNull: null
                                          }
                                        },
                                        todayEnd
                                      ]
                                    }
                                  ]
                                }
                              }
                            }
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      },
      {
        $match: { "callregistration.0": { $exists: true } }
      },
      {
        $lookup: {
          from: "products",
          localField: "callregistration.product",
          foreignField: "_id",
          as: "productDetails"
        }
      }
    ]);

    const mergedCalls = aggregated;

    // 4️⃣ Collect unique attendedBy & completedBy IDs/names
    const attendedByIds = new Set();
    const completedByIds = new Set();

    mergedCalls.forEach((call) => {
      call.callregistration.forEach((entry) => {
        // attendedBy
        let attendedBy = entry.formdata.attendedBy || [];
        if (!Array.isArray(attendedBy)) attendedBy = [attendedBy];
        attendedBy.forEach((attendee) => {
          if (!attendee) return;
          if (attendee.callerId) attendedByIds.add(attendee.callerId.toString());
          else if (attendee.name) attendedByIds.add(attendee.name);
        });

        // completedBy
        let completedBy = entry.formdata.completedBy || [];
        if (!Array.isArray(completedBy)) completedBy = [completedBy];
        completedBy.forEach((c) => {
          if (!c) return;
          if (c.callerId) completedByIds.add(c.callerId.toString());
          else if (c.name) completedByIds.add(c.name);
        });
      });
    });

    // Separate ObjectIds vs names
    const attendedByObjectIds = Array.from(attendedByIds).filter((id) => mongoose.Types.ObjectId.isValid(id));
    const attendedByNames = Array.from(attendedByIds).filter((id) => !mongoose.Types.ObjectId.isValid(id)).map((name) => ({ name }));
    const completedByObjectIds = Array.from(completedByIds).filter((id) => mongoose.Types.ObjectId.isValid(id));
    const completedByNames = Array.from(completedByIds).filter((id) => !mongoose.Types.ObjectId.isValid(id)).map((name) => ({ name }));

    // 5️⃣ Fetch staff/admin once per type
    const [
      attendedByStaff,
      attendedByAdmin,
      completedByStaff,
      completedByAdmin
    ] = await Promise.all([
      mongoose.model("Staff").find({ _id: { $in: attendedByObjectIds } }).select("name _id").lean(),
      mongoose.model("Admin").find({ _id: { $in: attendedByObjectIds } }).select("name _id").lean(),
      mongoose.model("Staff").find({ _id: { $in: completedByObjectIds } }).select("name _id").lean(),
      mongoose.model("Admin").find({ _id: { $in: completedByObjectIds } }).select("name _id").lean()
    ]);

    const attendedByCombined = [...attendedByStaff, ...attendedByAdmin, ...attendedByNames];
    const completedByCombined = [...completedByStaff, ...completedByAdmin, ...completedByNames];

    const userMap = new Map([...attendedByCombined, ...completedByCombined].map((user) => [
      user._id ? user._id.toString() : user.name, user.name
    ]));

    // 6️⃣ Map names back to attendedBy/completedBy
    mergedCalls.forEach((call) =>
      call.callregistration.forEach((entry) => {
        // attendedBy
        let attendedBy = entry.formdata.attendedBy || [];
        if (!Array.isArray(attendedBy)) attendedBy = [attendedBy];
        entry.formdata.attendedBy = attendedBy.map((att) => {
          if (!att) return att;
          const name = att.callerId ? userMap.get(att.callerId.toString()) : userMap.get(att.name);
          return name ? { ...att, callerId: { name } } : att;
        });

        // completedBy
        let completedBy = entry.formdata.completedBy || [];
        if (!Array.isArray(completedBy)) completedBy = [completedBy];
        entry.formdata.completedBy = completedBy.map((c) => {
          if (!c) return c;
          const name = c.callerId ? userMap.get(c.callerId.toString()) : userMap.get(c.name);
          return name ? { ...c, name } : c;
        });
      })
    );

    return res.status(200).json({ message: "calllist found", data: mergedCalls });
  } catch (error) {
    console.error("Error fetching call data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getunwnanted = async (req, res) => {
  try {
    const unwanted = await Customer.find({
      mobile: { $exists: false }
    });
    const un = await Customer.find({ mobile: "" })

    res.status(200).json({ message: "found customer", data: { unwanted, un } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




export const Downloadcustomerlist = async (req, res) => {
  try {
    const { customerType, branchselected, searchTerm } = req.query;
    if (!branchselected) {
      return res.status(400).json({ message: "branchid is missing" });
    }

    const branchId = new mongoose.Types.ObjectId(branchselected);
    const safe = escapeRegExp(String(searchTerm || "").trim());
    const regex = new RegExp(safe, "i");

    let matchConditions = {};
    let pipeline = [];

    // Common search filter (applied to all cases)
    const searchFilter = {
      $or: [
        { customerName: { $regex: regex } },
        { mobile: { $regex: regex } },

      ]
    };

    if (customerType === "ProductMissing") {
      matchConditions = {
        $and: [
          {
            $or: [
              { selected: { $exists: false } },
              { selected: { $size: 0 } }
            ]
          },
          searchFilter
        ]
      };

      pipeline = [
        { $match: matchConditions },
        {
          $group: {
            _id: "$_id",
            customerName: { $first: "$customerName" },
            address: { $first: "$address1" },
            pincode: { $first: "$pincode" },
            email: { $first: "$email" },
            mobile: { $first: "$mobile" }
          }
        },
        { $sort: { customerName: 1 } }
      ];
    } else {
      // --- MAIN SECTION FOR OTHER TYPES ---
      matchConditions = {
        $and: [
          {
            "selected.branch_id": branchId,
            selected: { $exists: true, $ne: [] },
            ...(customerType !== "Allcustomers" &&
              customerType !== "ProductinfoMissing" && {
              isActive: customerType
            }),
            ...(customerType === "ProductinfoMissing" && {
              selected: {
                $elemMatch: {
                  $or: [
                    { product_id: null },
                    { product_id: { $exists: false } }
                  ]
                }
              }
            })
          },
          {
            $or: [
              { customerName: { $regex: regex } },
              { mobile: { $regex: regex } },
              // ✅ Match inside selected.licensenumber
              {
                $expr: {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: "$selected",
                          as: "item",
                          cond: {
                            $regexMatch: {
                              input: { $toString: "$$item.licensenumber" },
                              regex: regex
                            }
                          }
                        }
                      }
                    },
                    0
                  ]
                }
              }
            ]
          }
        ]
      };

      pipeline = [
        { $match: matchConditions },
        { $unwind: "$selected" },
        {
          $lookup: {
            from: "products",
            localField: "selected.product_id",
            foreignField: "_id",
            as: "productDetails"
          }
        },
        {
          $unwind: {
            path: "$productDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            "selected.productName": "$productDetails.productName"
          }
        },
        {
          $group: {
            _id: "$_id",
            customerName: { $first: "$customerName" },
            address: { $first: "$address1" },
            pincode: { $first: "$pincode" },
            email: { $first: "$email" },
            mobile: { $first: "$mobile" },
            selected: { $push: "$selected" },
            status: { $first: "$isActive" }
          }
        },
        { $sort: { customerName: 1 } }
      ];
    }

    const customers = await Customer.aggregate(pipeline);

    const flattened = customers.flatMap((customer) => {
      if (Array.isArray(customer.selected) && customer.selected.length > 0) {
        return customer.selected.map((item) => ({
          customerName: customer.customerName,
          address: customer.address,
          pincode: customer.pincode,
          email: customer.email,
          mobile: customer.mobile,
          licenseNo: item.licensenumber || "-",
          status: customer.status || "-",
          branchName: item.branchName || "-",
          productName: item.productName || "-"
        }));
      } else {
        return {
          customerName: customer.customerName,
          address: customer.address,
          pincode: customer.pincode,
          email: customer.email,
          mobile: customer.mobile,
          licenseNo: "-",
          status: "-",
          branchName: "-",
          productName: "-"
        };
      }
    });

    if (flattened && flattened.length > 0) {
      return res.status(201).json({ message: "Customer found", data: flattened });
    } else {
      return res.status(200).json({ message: "No customers found", data: [] });
    }
  } catch (error) {
    console.log("error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


