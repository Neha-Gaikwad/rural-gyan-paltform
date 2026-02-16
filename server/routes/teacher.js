const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Quiz = require('../models/Quiz');
const Classroom = require('../models/Classroom');
const { auth, authorize } = require('../middlewares/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|mp4|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

// Apply auth and teacher authorization to all routes
router.use(auth, authorize('teacher'));

// Get teacher's assigned classes
router.get('/classes', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    const classrooms = await Classroom.find({
      teacherId: req.user.id,
      className: { $in: teacher.assignedClasses }
    })
      .populate('students', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        assignedClasses: teacher.assignedClasses,
        classrooms
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get students in a specific class
router.get('/students/:className', async (req, res) => {
  try {
    const students = await Student.find({ standard: req.params.className })
      .populate('userId', 'fullName email photo')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create quiz
router.post('/quiz', [
  body('title').notEmpty().trim(),
  body('classAssigned').notEmpty(),
  body('subject').notEmpty(),
  body('sections').isArray({ min: 1 }),
  body('duration').isInt({ min: 1 }),
  body('startTime').isISO8601(),
  body('endTime').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, classAssigned, subject, sections, duration, startTime, endTime } = req.body;

    const totalMarks = sections.reduce((secSum, section) => {
      return secSum + section.questions.reduce((qSum, q) => qSum + (q.marks || 1), 0);
    }, 0);

    const quiz = new Quiz({
      title,
      description,
      createdBy: req.user.id,
      classAssigned,
      subject,
      sections,
      totalMarks,
      duration,
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get teacher's quizzes
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user.id })
      .populate({
        path: 'submissions.studentId',
        select: 'fullName username email'
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update quiz
router.put('/quiz/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    Object.assign(quiz, req.body);
    
    if (req.body.sections) {
      quiz.totalMarks = req.body.sections.reduce((secSum, section) => {
        return secSum + section.questions.reduce((qSum, q) => qSum + (q.marks || 1), 0);
      }, 0);
    }

    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: quiz
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete quiz
router.delete('/quiz/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update student performance
router.post('/performance/:studentId', [
  body('subject').notEmpty(),
  body('marks').isNumeric(),
  body('totalMarks').isNumeric(),
  body('examType').isIn(['quiz', 'test', 'midterm', 'final'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const student = await Student.findOne({ userId: req.params.studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.performance.push({
      subject: req.body.subject,
      marks: req.body.marks,
      totalMarks: req.body.totalMarks,
      examType: req.body.examType
    });

    await student.save();

    res.json({
      success: true,
      message: 'Performance updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get materials
router.get('/materials', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    const classrooms = await Classroom.find({ teacherId: req.user.id });
    const allMaterials = classrooms.flatMap(c => 
      c.materials.map(m => ({ ...m.toObject(), _id: m._id, classroomId: c._id }))
    );

    res.json({ success: true, data: allMaterials });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload material
router.post('/materials', upload.single('file'), async (req, res) => {
  try {
    const { title, category, subject, dueDate } = req.body;
    
    if (!title || !category || !subject) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    let classroom = await Classroom.findOne({ 
      teacherId: req.user.id, 
      subject 
    });

    if (!classroom) {
      classroom = new Classroom({
        teacherId: req.user.id,
        subject,
        className: teacher.assignedClasses[0] || 'General',
        students: []
      });
    }

    const materialData = {
      title,
      type: category === 'video' ? 'video' : 'document',
      category,
      url: fileUrl,
      uploadedAt: new Date()
    };

    if (dueDate) {
      materialData.dueDate = new Date(dueDate);
    }

    classroom.materials.push(materialData);
    await classroom.save();

    res.status(201).json({
      success: true,
      message: 'Material uploaded successfully',
      data: classroom.materials[classroom.materials.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete material
router.delete('/materials/:classroomId/:materialId', async (req, res) => {
  try {
    const classroom = await Classroom.findOne({ 
      _id: req.params.classroomId, 
      teacherId: req.user.id 
    });
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    classroom.materials = classroom.materials.filter(
      m => m._id.toString() !== req.params.materialId
    );
    await classroom.save();

    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;