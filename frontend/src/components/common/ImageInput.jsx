import  { useEffect, useState } from "react"
import PropTypes from "prop-types"
import { toast } from "react-toastify"
import uploadImageToCloudinary from "../../utils/uploadImageToCloudinary.js"

function ImageInput({ onSelect, prevUrl, tag, compact = false, profilePhoto = false }) {
  const [signature, setSignature] = useState("")

  // Set initial signature state if prevUrl is provided
  useEffect(() => {
    if (prevUrl) {
      setSignature(prevUrl)
    }
  }, [prevUrl])

  const validateProfilePhoto = (file) => new Promise((resolve) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image.naturalWidth >= 256 && image.naturalHeight >= 256)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(false)
    }
    image.src = objectUrl
  })

  const handleFileInputChange = async (e) => {
    const files = e.target.files
    if (!files?.length) return

    if (profilePhoto) {
      const isHighEnoughResolution = await validateProfilePhoto(files[0])
      if (!isHighEnoughResolution) {
        toast.error("Choose a profile photo at least 256 × 256 pixels for a clear avatar.")
        e.target.value = ""
        return
      }
    }
    if (files.length > 1) {
      const uploadFiles = []
      for (const file of files) {
        const data = await uploadImageToCloudinary(file)
        uploadFiles.push(data.secure_url)
      }
      onSelect(uploadFiles)
    } else if (files.length === 1) {
      const data = await uploadImageToCloudinary(files[0]) // Access the first file
      onSelect(data.secure_url)
    }
  }

  return (
    <div className="mt-1">
      <label htmlFor={tag} className="block text-sm font-medium text-gray-700">
        {tag.replace(/([a-z])([A-Z])/g, "$1 $2")}
      </label>
      <input
        type="file"
        name={tag}
        multiple={!profilePhoto}
        onChange={handleFileInputChange}
        className={compact
          ? "block mt-1 w-full text-[10px] text-gray-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          : "block mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"}
      />
      {signature && (
        <div>
          <img
            src={signature}
            alt="Patient Signature"
            className="mt-4 w-34 h-14"
          />
        </div>
      )}
    </div>
  )
}

ImageInput.propTypes = {
  onSelect: PropTypes.func.isRequired,
  prevUrl: PropTypes.string,
  tag: PropTypes.string.isRequired,
  compact: PropTypes.bool,
  profilePhoto: PropTypes.bool
}

export default ImageInput
