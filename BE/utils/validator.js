let { body, validationResult } = require('express-validator')
module.exports = {
    validatedResult: function (req, res, next) {
        let result = validationResult(req);
        if (result.errors.length > 0) {
            res.status(400).send({
                success: false,
                message: result.errors[0].msg
            });
            return;
        }
        next();
    },
    CreateAnUserValidator: [
        body('email').notEmpty().withMessage("email khong duoc de trong").bail().isEmail().withMessage("email sai dinh dang").normalizeEmail(),
        body('username').notEmpty().withMessage("username khong duoc de trong").bail().isAlphanumeric().withMessage("username khong duoc chua ki tu dac biet"),
        body('password').notEmpty().withMessage("password khong duoc de trong").bail().isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1
        }).withMessage("password phai co it nhat 8 ki tu trong do co it nhat 1 ki tu chu hoa, 1 ki tu chu thuong,1 ki tu so va 1 ki tu dac biet"),
        body('role').notEmpty().withMessage("role khong duoc de trong").bail().isMongoId().withMessage("role phai la ID"),
        body('avatarUrl').optional().isArray().withMessage("avatarURl pahi la 1 mang"),
        body('avatarUrl.*').isURL().withMessage("URL khong hop le"),
    ],
    RegisterValidator: [
        body('email').notEmpty().withMessage("email khong duoc de trong").bail().isEmail().withMessage("email sai dinh dang").normalizeEmail(),
        body('username').notEmpty().withMessage("username khong duoc de trong").bail().isAlphanumeric().withMessage("username khong duoc chua ki tu dac biet"),
        body('password').notEmpty().withMessage("password khong duoc de trong").bail().isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1
        }).withMessage("password phai co it nhat 8 ki tu trong do co it nhat 1 ki tu chu hoa, 1 ki tu chu thuong,1 ki tu so va 1 ki tu dac biet"),
    ],ChangePasswordValidator: [
        body('oldpassword').notEmpty().withMessage("email khong duoc de trong"),
        body('newpassword').notEmpty().withMessage("password khong duoc de trong").bail().isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1
        }).withMessage("password phai co it nhat 8 ki tu trong do co it nhat 1 ki tu chu hoa, 1 ki tu chu thuong,1 ki tu so va 1 ki tu dac biet"),
    ],
    ModifyAnUserValidator: [
        body('email').isEmpty().withMessage("email khong duoc thay doi"),
        body('username').isEmpty().withMessage("username khong duoc thay doi"),
        body('password').optional().isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1
        }).withMessage("password phai co it nhat 8 ki tu trong do co it nhat 1 ki tu chu hoa, 1 ki tu chu thuong,1 ki tu so va 1 ki tu dac biet"),
        body('role').isEmpty().withMessage("role khong duoc thay doi"),
        body('avatarUrl').optional().isArray().withMessage("avatarURl pahi la 1 mang"),
        body('avatarUrl.*').isURL().withMessage("URL khong hop le"),
    ],
    CreateArticleValidator: [
        body('title')
            .notEmpty().withMessage("Tiêu đề không được để trống")
            .bail()
            .isLength({ min: 5 }).withMessage("Tiêu đề phải có ít nhất 5 ký tự"),
            
        body('summary')
            .optional()
            .isLength({ max: 500 }).withMessage("Mô tả ngắn không được quá 500 ký tự"),
            
        body('content')
            .notEmpty().withMessage("Nội dung bài viết không được để trống"),
        body('imageUrl.*').isURL().withMessage("URL khong hop le"),
    ]
}