import express from "express"
import multer from "multer"
import fs from "fs"
import path from "path"
import { exec } from "child_process"
import { fileURLToPath } from "url"
import { dirname } from "path"
import cors from "cors"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads"
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, `temp_${Date.now()}_${file.originalname}`)
  },
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true)
    } else {
      cb(new Error("Only PDF files are allowed"), false)
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
})

// Middleware
app.use(cors())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use(express.static("public"))

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "PDF encryption service is running" })
})

// Main encryption endpoint
app.post("/encrypt-pdf", upload.single("pdf"), async (req, res) => {
  let inputPath = null
  let outputPath = null

  try {
    // Validate required fields
    if (!req.file) {
      return res.status(400).json({
        error: "No PDF file provided",
        message: "Please upload a PDF file to encrypt",
      })
    }

    const { password, permissions = {} } = req.body

    if (!password || password.length < 4) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path)
      return res.status(400).json({
        error: "Invalid password",
        message: "Password must be at least 4 characters long",
      })
    }

    inputPath = req.file.path
    outputPath = path.join("uploads", `encrypted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`)

    // Construct qpdf command
    // Using 256-bit AES encryption with user and owner passwords
    const userPassword = password
    const ownerPassword = password + "_owner" // Different owner password for security

    let command = `qpdf --encrypt "${userPassword}" "${ownerPassword}" 256`

    command += ` -- "${inputPath}" "${outputPath}"`

    console.log("Executing qpdf command...")

    // Execute qpdf command
    await new Promise((resolve, reject) => {
      exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error) {
          console.error("qpdf execution error:", error)
          console.error("stderr:", stderr)
          reject(new Error(`Encryption failed: ${stderr || error.message}`))
          return
        }

        console.log("qpdf completed successfully")
        if (stdout) console.log("stdout:", stdout)
        resolve()
      })
    })

    // Verify output file exists
    if (!fs.existsSync(outputPath)) {
      throw new Error("Encrypted PDF was not created")
    }

    // Get file stats for response headers
    const stats = fs.statSync(outputPath)
    const filename = `encrypted_${Date.now()}.pdf`

    // Set response headers
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    res.setHeader("Content-Length", stats.size)

    // Stream the file to response
    const fileStream = fs.createReadStream(outputPath)

    fileStream.on("error", (error) => {
      console.error("File stream error:", error)
      if (!res.headersSent) {
        res.status(500).json({ error: "Error reading encrypted file" })
      }
    })

    fileStream.on("end", () => {
      // Clean up files after streaming
      setTimeout(() => {
        try {
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError)
        }
      }, 1000)
    })

    fileStream.pipe(res)
  } catch (error) {
    console.error("Encryption process error:", error)

    // Clean up files on error
    try {
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
      if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError)
    }

    if (!res.headersSent) {
      res.status(500).json({
        error: "Encryption failed",
        message: error.message || "An unexpected error occurred during PDF encryption",
      })
    }
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Express error:", error)

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        message: "PDF file size must be less than 50MB",
      })
    }
  }

  res.status(500).json({
    error: "Server error",
    message: error.message || "An unexpected error occurred",
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    message: "The requested endpoint does not exist",
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`PDF encryption server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
  console.log(`Encryption endpoint: http://localhost:${PORT}/encrypt-pdf`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully")
  process.exit(0)
})
