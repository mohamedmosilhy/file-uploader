# File Uploader

A clean and simple file management application built with Node.js, Express, and Supabase. Upload, organize, and manage your files with an intuitive folder structure.

## Features

### 🔐 User Authentication
- **Sign Up** - Create a new account with username and password
- **Login/Logout** - Secure authentication using Passport.js
- **Session Management** - Persistent sessions stored in PostgreSQL

### 📁 Folder Management
- **Create Folders** - Organize files with custom folders
- **Nested Folders** - Support for hierarchical folder structure
- **Delete Folders** - Remove folders and all their contents
- **Cascade Deletion** - Automatically delete child folders and files

### 📄 File Management
- **Upload Files** - Upload files up to 50MB
- **Download Files** - Download your files anytime
- **Delete Files** - Remove unwanted files
- **File Organization** - Assign files to specific folders
- **Cloud Storage** - Files stored securely in Supabase Storage

### 🎨 User Interface
- Clean and responsive design
- Flash messages for user feedback
- Easy navigation between folders

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Passport.js with bcrypt
- **File Storage**: Supabase Storage
- **File Upload**: Multer (memory storage)
- **View Engine**: EJS
- **Session Store**: @quixo3/prisma-session-store

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd file-uploader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/fileuploader"
   SESSION_SECRET="your-secret-key"
   SUPABASE_URL="your-supabase-url"
   SUPABASE_KEY="your-supabase-anon-key"
   PORT=3000
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   ```

5. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

6. **Start the application**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

7. **Access the application**
   
   Open your browser and navigate to `http://localhost:3000`

## Database Schema

- **User** - Stores user credentials and information
- **Folder** - Hierarchical folder structure with parent-child relationships
- **File** - File metadata (name, path, size) with references to folders and users
- **Session** - User session data

## File Size Limit

Maximum file size: **50MB**

## Security Features

- Password hashing with bcryptjs
- Session-based authentication
- User-specific file and folder access
- Secure file storage in Supabase

## Project Structure

```
file-uploader/
├── app.js                 # Application entry point
├── config/
│   └── passport.js        # Passport authentication strategy
├── controllers/
│   └── index.js           # Route controllers
├── middlewares/
│   └── auth.js            # Authentication middleware
├── routes/
│   └── index.js           # Route definitions
├── views/                 # EJS templates
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
└── public/                # Static assets
```

## License

ISC
