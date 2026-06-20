/**
 * mlService.js — Heuristic Prediction Engine with FastAPI ML Integration
 *
 * Calls the external FastAPI ML model for prediction. If the model server is
 * unreachable, falls back to a heuristic engine using weighted thresholds.
 */

const axios = require("axios");

const getPrediction = async (telemetry) => {
    const mlApiUrl = process.env.ML_API || "http://127.0.0.1:8000/predict";

    // Map telemetry metrics to what the ML API expects
    const payload = {
        device_name: telemetry.hostname || telemetry.deviceId || "Unknown Dell Device",
        os_version: telemetry.os || telemetry.osVersion || "Windows 11",
        ram_capacity: telemetry.ramCapacityGB !== undefined ? Number(telemetry.ramCapacityGB) : undefined,
        disk_read: telemetry.diskReadMBps !== undefined ? Number(telemetry.diskReadMBps) : undefined,
        disk_write: telemetry.diskWriteMBps !== undefined ? Number(telemetry.diskWriteMBps) : undefined,
        process_count: telemetry.processCount !== undefined ? Number(telemetry.processCount) : undefined,
        battery_health: telemetry.batteryHealth !== undefined ? Number(telemetry.batteryHealth) : undefined,
        cpu_temp: telemetry.cpuTemp !== undefined ? Number(telemetry.cpuTemp) : undefined,
        disk_type: telemetry.diskType || "SSD"
    };

    try {
        console.log(`[ML Service] Connecting to ML API: ${mlApiUrl}`);
        const response = await axios.post(mlApiUrl, payload, { timeout: 3500 });
        
        if (response.data && response.data.status === "success") {
            const diag = response.data.diagnostics;
            console.log(`[ML Service] ML Model response success. Risk Level: ${diag.risk_level}`);

            // Map python risk level (Low, Moderate, High, Critical) to backend (low, warning, critical)
            let mappedRisk = "low";
            const pythonRisk = (diag.risk_level || "Low").toLowerCase();
            if (pythonRisk === "critical" || pythonRisk === "high") {
                mappedRisk = "critical";
            } else if (pythonRisk === "moderate" || pythonRisk === "warning") {
                mappedRisk = "warning";
            }

            return {
                healthScore: Math.round(diag.health_score),
                failureProbability: Math.round(diag.failure_probability_percent),
                riskLevel: mappedRisk,
                predictedComponent: diag.predicted_component,
                rootCause: diag.root_cause
            };
        }
    } catch (error) {
        console.warn(`[ML Service] FastAPI connection failed (${error.message}). Falling back to heuristic prediction.`);
    }

    // ── Heuristics Fallback Engine ──────────────────────────────
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

    // CPU/RAM performance pressure
    const cpuPressure  = cpuUsage  >= 95 ? 90 : cpuUsage  >= 85 ? 65 : cpuUsage  >= 70 ? 40 : cpuUsage  >= 50 ? 20 : 5;
    const ramPressure  = ramUsage  >= 95 ? 90 : ramUsage  >= 85 ? 65 : ramUsage  >= 75 ? 40 : ramUsage  >= 60 ? 20 : 5;

    // Overall failure probability (weighted average)
    const failureProbability = Math.round(
        thermalScore  * 0.25 +
        storageScore  * 0.20 +
        powerScore    * 0.15 +
        coolingScore  * 0.15 +
        cpuPressure   * 0.15 +
        ramPressure   * 0.10
    );

    // Risk level
    const riskLevel =
        failureProbability >= 70 ? "critical" :
        failureProbability >= 40 ? "warning"  : "low";

    // Health score (inverse of risk)
    const healthScore = 100 - failureProbability;

    // Identify the worst subsystem
    const subsystems = [
        { name: "Thermal / CPU",   score: thermalScore  },
        { name: "Storage / Disk",  score: storageScore  },
        { name: "Power / Battery", score: powerScore    },
        { name: "Cooling / Fan",   score: coolingScore  },
    ];
    subsystems.sort((a, b) => b.score - a.score);
    const worst = subsystems[0];

    const predictedComponent = riskLevel === "low" ? "None" : worst.name;

    // Root cause message
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