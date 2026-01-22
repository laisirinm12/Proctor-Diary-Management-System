const express = require("express");
const ProctorDiary = require("../models/ProctorDiary");
const { protect, proctorOnly } = require("../middleware/authMiddleware");

const router = express.Router();

/* SAVE / UPDATE DIARY (PROCTOR ONLY) */
// router.post("/", protect, proctorOnly, async (req, res) => {
//     try {
//       const { usn } = req.body;
  
//       const updatedDiary = await ProctorDiary.findOneAndUpdate(
//         { usn },              // 🔍 find by USN
//         { $set: req.body },   // ✅ update fields safely
//         {
//           new: true,          // return updated document
//           upsert: true,       // create if not exists
//           setDefaultsOnInsert: true
//         }
//       );
  
//       res.json(updatedDiary);
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ msg: "Failed to save diary" });
//     }
//   });  

router.post("/", protect, proctorOnly, async (req, res) => {
    try {
      console.log("📥 Incoming diary data:", JSON.stringify(req.body, null, 2));
  
      const { usn } = req.body;
      if (!usn) {
        return res.status(400).json({ msg: "USN missing" });
      }
  
      const existing = await ProctorDiary.findOne({ usn });

      const diary = await ProctorDiary.findOneAndUpdate(
        { usn },
        {
          $set: {
            personalInfo: {
              ...existing?.personalInfo,
              ...req.body.personalInfo
            },
            semesters: req.body.semesters.map((sem, i) => ({
              ...existing?.semesters?.[i]?._doc,
              ...sem,
              medicalFile: sem.medicalFile || existing?.semesters?.[i]?.medicalFile
            })),
            lastUpdatedBy: req.body.lastUpdatedBy
          }
        },
        { new: true, upsert: true }
      );
      
  
      console.log("✅ Saved diary:", diary);
      res.json(diary);
  
    } catch (err) {
      console.error("❌ Save error:", err);
      res.status(500).json({ msg: "Failed to save diary" });
    }
  });
  
/* GET DIARY BY USN (STUDENT + PROCTOR) */
router.get("/:usn", protect, async (req, res) => {
  try {
    const diary = await ProctorDiary.findOne({ usn: req.params.usn });
    if (!diary) return res.status(404).json({ msg: "No diary found" });

    res.json(diary);
  } catch {
    res.status(500).json({ msg: "Error fetching diary" });
  }
});

module.exports = router;
