/**
 * mlService.js — Heuristic Prediction Engine (ML API bypass)
 *
 * Computes risk scores directly from telemetry metrics using
 * weighted thresholds. Produces the same output shape that the
 * real ML API will return, so it can be swapped in seamlessly later.
 */

const getPrediction = async (telemetry) => {
    const {
        cpuUsage    = 0,
        cpuTemp     = 0,
        ramUsage    = 0,
        diskUsage   = 0,
        batteryHealth = 100,
        fanRpm      = 0,
        smartHealth = 100,
        gpuTemp     = 0,
    } = telemetry;

    // ── Per-subsystem risk scores (0–100) ──────────────────────────────
    // Thermal risk: driven by CPU temp and GPU temp
    const thermalScore = Math.min(100, Math.max(
        cpuTemp  >= 90 ? 95 : cpuTemp  >= 80 ? 75 : cpuTemp  >= 70 ? 50 : cpuTemp  >= 60 ? 25 : 5,
        gpuTemp  >= 85 ? 80 : gpuTemp  >= 75 ? 55 : gpuTemp  >= 65 ? 30 : 5
    ));

    // Cooling risk: high fan RPM = fans working hard = possible thermal throttle
    const coolingScore =
        fanRpm >= 5500 ? 85 :
        fanRpm >= 4500 ? 60 :
        fanRpm >= 3500 ? 35 :
        fanRpm === 0   ? 10 : // no fan data
        5;

    // Storage/Disk risk: disk usage + S.M.A.R.T health
    const diskScore  = diskUsage  >= 95 ? 90 : diskUsage  >= 85 ? 65 : diskUsage  >= 75 ? 40 : diskUsage  >= 60 ? 20 : 5;
    const smartScore = smartHealth <= 20 ? 90 : smartHealth <= 40 ? 70 : smartHealth <= 60 ? 45 : smartHealth <= 80 ? 20 : 5;
    const storageScore = Math.round((diskScore * 0.5) + (smartScore * 0.5));

    // Power risk: battery health degradation
    const powerScore =
        batteryHealth <= 20 ? 90 :
        batteryHealth <= 40 ? 70 :
        batteryHealth <= 60 ? 45 :
        batteryHealth <= 80 ? 20 :
        5;

    // CPU/RAM performance pressure (contributes to overall but not a component itself)
    const cpuPressure  = cpuUsage  >= 95 ? 90 : cpuUsage  >= 85 ? 65 : cpuUsage  >= 70 ? 40 : cpuUsage  >= 50 ? 20 : 5;
    const ramPressure  = ramUsage  >= 95 ? 90 : ramUsage  >= 85 ? 65 : ramUsage  >= 75 ? 40 : ramUsage  >= 60 ? 20 : 5;

    // ── Overall failure probability (weighted average) ─────────────────
    const failureProbability = Math.round(
        thermalScore  * 0.25 +
        storageScore  * 0.20 +
        powerScore    * 0.15 +
        coolingScore  * 0.15 +
        cpuPressure   * 0.15 +
        ramPressure   * 0.10
    );

    // ── Risk level ─────────────────────────────────────────────────────
    const riskLevel =
        failureProbability >= 70 ? "critical" :
        failureProbability >= 40 ? "warning"  : "low";

    // ── Health score (inverse of risk) ─────────────────────────────────
    const healthScore = 100 - failureProbability;

    // ── Identify the worst subsystem ────────────────────────────────────
    const subsystems = [
        { name: "Thermal / CPU",   score: thermalScore  },
        { name: "Storage / Disk",  score: storageScore  },
        { name: "Power / Battery", score: powerScore    },
        { name: "Cooling / Fan",   score: coolingScore  },
    ];
    subsystems.sort((a, b) => b.score - a.score);
    const worst = subsystems[0];

    const predictedComponent = riskLevel === "low" ? "None" : worst.name;

    // ── Root cause message ──────────────────────────────────────────────
    const rootCauseMap = {
        "Thermal / CPU":   `CPU temperature elevated (${cpuTemp}°C). Risk of thermal throttling.`,
        "Storage / Disk":  `Disk usage at ${diskUsage}% with S.M.A.R.T health at ${smartHealth}%. Storage degradation detected.`,
        "Power / Battery": `Battery health at ${batteryHealth}%. Power subsystem showing wear.`,
        "Cooling / Fan":   `Fan running at ${fanRpm} RPM. Cooling performance may be insufficient.`,
    };
    const rootCause = riskLevel === "low"
        ? "All subsystems within normal operating parameters."
        : (rootCauseMap[worst.name] || "Multiple subsystems showing elevated risk.");

    return {
        healthScore,
        failureProbability,
        riskLevel,
        predictedComponent,
        rootCause,
    };
};

module.exports = { getPrediction };