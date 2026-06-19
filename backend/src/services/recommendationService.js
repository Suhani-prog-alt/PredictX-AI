const generateRecommendation = (prediction) => {
    const recommendations = [];

    if (prediction.failureProbability >= 80) {
        recommendations.push("Backup important files.");
        recommendations.push("Replace the failing component.");
        recommendations.push("Monitor system continuously.");
    } else if (prediction.failureProbability >= 50) {
        recommendations.push("Schedule hardware maintenance.");
        recommendations.push("Monitor system regularly.");
    } else {
        recommendations.push("System is healthy.");
        recommendations.push("Continue regular monitoring.");
    }

    return recommendations;
};

module.exports = {
    generateRecommendation
};