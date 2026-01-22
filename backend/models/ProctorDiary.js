const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  agenda: String,
  date: String,
  issues: String,
  action: String
});

const semesterSchema = new mongoose.Schema({
  semesterNo: Number,
  meetings: [meetingSchema],
  sgpa: String,
  leaveFrom: String,
  leaveTo: String,
  medicalFile: String
});

const proctorDiarySchema = new mongoose.Schema(
  {
    usn: { type: String, required: true, unique: true },

    personalInfo: {
      name: String,
      dob: String,
      father: String,
      mother: String,
      photo: String,
      esign: String
    },

    semesters: [semesterSchema],

    lastUpdatedBy: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProctorDiary", proctorDiarySchema);
