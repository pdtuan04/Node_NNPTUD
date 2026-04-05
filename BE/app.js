var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
let mongoose = require("mongoose");
let cors = require("cors");
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
let { agenda, startBackgroundJobs } = require("./utils/backgroundHandler");
var app = express();
app.use(cors({
  origin: 'https://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use('/', indexRouter);
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/categories', require('./routes/categories'));
app.use('/api/v1/roles', require('./routes/roles'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/v1/carts', require('./routes/carts'));
app.use('/api/v1/upload', require('./routes/upload'));
app.use('/api/v1/messages', require('./routes/messages'));
app.use('/api/v1/articles', require('./routes/articles'));
app.use('/api/v1/comments', require('./routes/comments'));
app.use('/api/v1/bookings', require('./routes/bookings'));
app.use('/api/v1/pets', require('./routes/pets'));
app.use('/api/v1/services', require('./routes/services'));
app.use('/api/v1/pet-types', require('./routes/petTypes'));
mongoose.connect('mongodb://localhost:27017/NNPTUD-C3?replicaSet=rs0');
mongoose.connection.on('connected', () => {
  console.log("connected");
  startBackgroundJobs();
});

mongoose.connection.on('disconnected', () => {
  console.log("disconnected");
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
