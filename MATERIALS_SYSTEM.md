# Materials Management System

## Overview
Complete materials management system allowing teachers to upload study materials and students to access them categorized by type.

## Features Implemented

### Teacher Side
1. **Materials Management Page** (`/teacher/materials`)
   - Upload materials from local system (no URL needed)
   - Categorize materials as:
     - **Notes** - PDF, DOC, PPT files
     - **Video** - Video lectures (MP4, AVI, MOV)
     - **Assignment** - Assignments with due dates
   - View all uploaded materials
   - Delete materials
   - Accessible from sidebar and subject management modal

2. **File Upload**
   - Direct file upload from teacher's computer
   - Supports: PDF, DOC, DOCX, PPT, PPTX, MP4, AVI, MOV
   - File size limit: 50MB
   - Files stored in `server/uploads/` directory

3. **Assignment Features**
   - Optional due date for assignments
   - Students can see due dates

### Student Side
1. **Materials Page** (`/student/materials`)
   - Tabbed interface:
     - **All Materials** - All notes, videos, assignments
     - **Notes** - Study materials and PDFs
     - **Videos** - Video lectures
     - **Assignments** - Assignments with due dates
     - **Quizzes** - Quiz assignments
     - **History** - Completed/expired items

2. **Material Actions**
   - **Notes/Videos**: View and Download buttons
   - **Assignments**: View Assignment button
   - **Quizzes**: Start Quiz button (if pending)
   - Category badges for easy identification
   - Due date display for assignments

## Technical Implementation

### Backend
- **Multer** for file uploads
- Files stored in `server/uploads/`
- Static file serving at `/uploads` endpoint
- Updated Classroom model with `category` and `dueDate` fields

### Database Schema
```javascript
materials: [{
  title: String,
  type: String,
  category: 'notes' | 'video' | 'assignment',
  url: String,
  dueDate: Date,
  uploadedAt: Date
}]
```

### API Endpoints
- `GET /api/teacher/materials` - Get all materials
- `POST /api/teacher/materials` - Upload material (multipart/form-data)
- `DELETE /api/teacher/materials/:classroomId/:materialId` - Delete material
- `GET /api/student/materials` - Get materials for student

## Installation Requirements

Install multer package:
```bash
cd server
npm install multer
```

Create uploads directory:
```bash
mkdir uploads
```

## Usage Flow

### Teacher Workflow
1. Navigate to Materials section from sidebar
2. Click "Upload Material"
3. Select category (Notes/Video/Assignment)
4. Enter title and subject
5. Choose file from computer
6. Add due date (for assignments)
7. Click Upload

### Student Workflow
1. Navigate to Materials section
2. Use tabs to filter by category
3. Click View to open material
4. Click Download to save locally
5. For quizzes, click "Start Quiz"

## File Access
- Uploaded files accessible at: `http://localhost:5000/uploads/filename`
- Frontend automatically constructs URLs for viewing/downloading
