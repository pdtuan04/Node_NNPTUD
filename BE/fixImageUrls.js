require("dotenv").config();
const mongoose = require("mongoose");
const petTypeModel = require("./schemas/petTypes");

const BASE_URL = "http://localhost:8080";

async function fix() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/NNPTUD-C3?replicaSet=rs0");
  console.log("Connected");

  const petTypes = await petTypeModel.find({ isDeleted: false });

  for (const pt of petTypes) {
    if (!pt.image) continue;

    let newUrl = pt.image;

    // Nếu đã là full URL thì bỏ qua
    if (pt.image.startsWith("http")) {
      console.log(`[SKIP] ${pt.name}: ${pt.image}`);
      continue;
    }

    // uploads/xxx.jpg -> http://localhost:8080/uploads/xxx.jpg
    if (pt.image.startsWith("uploads/") || pt.image.startsWith("/uploads/")) {
      newUrl = BASE_URL + "/" + pt.image.replace(/^\//, "");
    } else {
      newUrl = BASE_URL + "/uploads/" + pt.image;
    }

    await petTypeModel.findByIdAndUpdate(pt._id, { image: newUrl });
    console.log(`[FIXED] ${pt.name}: ${pt.image} -> ${newUrl}`);
  }

  console.log("Done");
  process.exit(0);
}

fix().catch((e) => { console.error(e); process.exit(1); });
