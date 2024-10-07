import XLSX from "xlsx" // Assuming you're using XLSX to parse Excel files
import Product from "../../model/primaryUser/productSchema.js"
import Company from "../../model/primaryUser/companySchema.js"
import Branch from "../../model/primaryUser/branchSchema.js"
import Customer from "../../model/secondaryUser/customerSchema.js"
import License from "../../model/secondaryUser/licenseSchema.js"
import {
  Brand,
  Category
} from "../../model/primaryUser/productSubDetailsSchema.js"
export const ExceltoJson = async (socket, fileData) => {
  // Parse the uploaded Excel file
  const workbook = XLSX.read(fileData, { type: "buffer" })
  const sheetName = workbook.SheetNames[0] // Assuming the first sheet
  const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])

  const product = await Product.find()
  const company = await Company.find()
  const branch = await Branch.find()
  const brand = await Brand.find()
  const category = await Category.find()
  const licenseNumber = await License.find()
  let uploadedCount = 0
  const totalData = worksheet.length
  const failedData = []

  for (const item of worksheet) {
    try {
      const matchingLicensenumber = licenseNumber.find(
        (license) => license.licensenumber === item["CUSTOMER ID"]
      )
      if (!matchingLicensenumber) {
        const matchingCompany = company.find(
          (company) => company.companyName === "CAMET GROUP"
        )

        const matchingProduct = product.find(
          (product) => product.productName === item["Type"].toUpperCase()
        )
        // arr.push(item["Type"])

        const matchingBranch = branch.find(
          (branch) => branch.branchName === item["Branch"].toUpperCase()
        )
        const matchingBrand = brand.find(
          (brand) => brand.brand === item["S/W Type"].toUpperCase()
        )

        const matchingCategory = category.find(
          (category) => category.category === item["User"].toUpperCase()
        )

        // Determine the suffix based on the user type

        // Find the matching branch using the modified branch name

        const selectedData = [
          {
            company_id: matchingCompany ? matchingCompany._id : null,
            companyName: matchingCompany ? matchingCompany.companyName : "",
            branch_id: matchingBranch ? matchingBranch._id : null,
            branchName: matchingBranch ? matchingBranch.branchName : "",
            product_id: matchingProduct ? matchingProduct._id : null,
            productName: matchingProduct ? matchingProduct.productName : null,

            brandName: matchingBrand ? matchingBrand.brand : null,
            categoryName: matchingCategory ? matchingCategory.category : null,
            licensenumber: item["CUSTOMER ID"],
            softwareTrade: item["Software Trade"],
            noofusers: item["NoOfUser"],
            companyusing: item["CompanyUsing"],
            version: item["Version"],
            customerAddDate: item["Act On"],
            amcstartDate: item["Software HitDate"],
            amcendDate: item["Due On"],
            amcAmount: "",
            amcDescription: "",
            licenseExpiryDate: "",
            productAmount: item["Total Amount"],
            productamountDescription: "",
            tvuexpiryDate: "",
            tvuAmount: "666",
            tvuamountDescription: "",
            isActive: item["Party Status"]
          }
        ]

        if (item["Wallet Name"]) {
          selectedData.push({
            company_id: matchingCompany ? matchingCompany._id : null,
            companyName: matchingCompany ? matchingCompany.name : "",
            branch_id: matchingBranch ? matchingBranch._id : null,
            branchName: matchingBranch ? matchingBranch.branchName : "",
            product_id: matchingProduct ? matchingProduct._id : null,
            productName: item["Wallet Name"],
            brandName: item["S/W Type"],
            categoryName: item["User"],
            licensenumber: item["Wallet Id"],
            softwareTrade: item["Software Trade"],
            noofusers: item["NoOfUser"],
            companyusing: item["CompanyUsing"],
            version: item["Version"],
            customerAddDate: item["Act On"],
            amcstartDate: item["Software HitDate"],
            amcendDate: item["Due On"],
            amcAmount: item["Total Amount"],
            amcDescription: "",
            licenseExpiryDate: "",
            productAmount: "",
            productamountDescription: "",
            tvuexpiryDate: "",
            tvuAmount: "",
            tvuamountDescription: "",
            isActive: item["Party Status"]
          })
        }
        if (item["Mobile App Name"]) {
          selectedData.push({
            company_id: matchingCompany ? matchingCompany._id : null,
            companyName: matchingCompany ? matchingCompany.name : "",
            branch_id: matchingBranch ? matchingBranch._id : null,
            branchName: matchingBranch ? matchingBranch.branchName : "",
            product_id: matchingProduct ? matchingProduct._id : null,
            productName: item["Mobile App Name"],

            brandName: item["S/W Type"],
            categoryName: item["User"],
            licensenumber: item["Mobile App Id"],
            softwareTrade: item["Software Trade"],
            noofusers: item["NoOfUser"],
            companyusing: item["CompanyUsing"],
            version: item["Version"],
            customerAddDate: item["Act On"],
            amcstartDate: item["Software HitDate"],
            amcendDate: item["Due On"],
            amcAmount: item["Total Amount"],
            amcDescription: "",
            licenseExpiryDate: "",
            productAmount: "",
            productamountDescription: "",
            tvuexpiryDate: "",
            tvuAmount: "",

            isActive: item["Party Status"]
          })
        }
        const existingCustomer = await Customer.findOne({
          "selected.licensenumber": item["CUSTOMER ID"]
        })
        const existingLicensenumber = await License
        if (!existingCustomer) {
          const customerData = new Customer({
            customerName: item["Party Name"],
            address1: item["Address"],
            country: item["Country"],
            state: item["State"],
            city: item["City"],
            pincode: item["OnlineZipCode"],
            email: item["EmailID"],
            mobile: item["Mobile"],
            landline: item["Landline"],
            contactPerson: item["Contact Person"],
            isActive: item["Party Status"],
            selected: selectedData
          })
          await customerData.save()
          for (const item of customerData.selected) {
            const license = new License({
              products: item.product_id,
              customerName: customerData._id, // Using the customer ID from the parent object
              licensenumber: item.licensenumber
            })

            await license.save()
          }
          uploadedCount++
        } else {
          failedData.push(item)
        }

        socket.emit("conversionProgress", {
          current: uploadedCount,
          total: totalData
        })
      }
    } catch (error) {
      console.error("Error saving customer data:", error.message)
      failedData.push(item) // Capture the item that failed to save
    }
  }

  if (uploadedCount > 0) {
    console.log("All data processed successfully.")

    socket.emit("conversionComplete", {
      message:
        failedData.length === 0
          ? "conversion completed"
          : "conversion is partially completed",
      secondaryMessage: "some files are not saved due to same license number",
      nonsavingData: failedData // Emit the array of unsaved data
    })
  } else {
    // If no data was uploaded successfully, emit an error
    socket.emit("conversionError", {
      message: "This file is already uploaded"
      // nonsavingData: failedData // Include the failed data in the error message
    })
  }
}
