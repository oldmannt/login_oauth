import winston from "winston";

const logLevel = process.env.NODE_ENV === "production" ? "error" : "debug";
const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize({all: true}),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.Console({ level: logLevel }),
        new winston.transports.File({ filename: "debug.log", level: logLevel })
    ]
});

export default logger;