require('dotenv').config();
const express = require("express")
const app = express()
const cors = require("cors")
const DBconnect = require("./config/DBConnect")
const httpStatusText = require("./utils/httpStatusText")
const organizerRoutes = require("./routes/organizer.routes")
const attendeeRoutes = require("./routes/attendee.routes");
const authRouter = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes")


DBconnect()

app.use(cors())
app.use(express.json())

app.use("/api/auth", authRouter);
app.use("/api/organizer", organizerRoutes)
app.use("/api/attendee", attendeeRoutes);
app.use("/api/admin", adminRoutes)

app.use((req, res, next) => {
  return res
    .status(404)
    .json({
      status: httpStatusText.ERROR,
      message: "this resource is not available",
    });
});

app.use((error, req, res, next) => {
  res
    .status(error.statusCode || 500)
    .json({
      status: error.statusText || httpStatusText.ERROR,
      message: error.message,
      code: error.statusCode || 500,
      data: null,
    });
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log("Listening to port", port);
    console.log(`running at http://localhost:${port}`);
})