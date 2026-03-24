<?php
declare(strict_types=1);
require_once __DIR__ . "/config.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    send_json(["status" => "ok"]);
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    send_json(["success" => false, "message" => "Only POST requests are allowed."], 405);
}

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput ?: "{}", true);

$name = sanitize_name((string)($data["name"] ?? ""));
$score = (int)($data["score"] ?? -1);

if ($name === "") {
    send_json(["success" => false, "message" => "Player name is required."], 422);
}

if ($score < 0 || $score > MAX_SCORE) {
    send_json(["success" => false, "message" => "Invalid score value."], 422);
}

$scores = read_scores();
$scores[] = [
    "name" => $name,
    "score" => $score,
    "date" => date("Y-m-d")
];

usort($scores, function ($a, $b) {
    return ((int)$b["score"]) <=> ((int)$a["score"]);
});

$scores = array_slice($scores, 0, MAX_ENTRIES);

if (!write_scores($scores)) {
    send_json(["success" => false, "message" => "Unable to save score."], 500);
}

send_json(["success" => true, "message" => "Score saved successfully."]);
?>
