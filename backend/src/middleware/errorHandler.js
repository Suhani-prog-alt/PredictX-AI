const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;

    console.error(`[${req.method}] ${req.path} - ${err.message}`);

    res.status(status).json({
        message: err.message || "Internal Server Error"
    });
};

module.exports = errorHandler;
