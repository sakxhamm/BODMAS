<?php
declare(strict_types=1);
require_once __DIR__ . "/config.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    send_json(["status" => "ok"]);
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    send_json(["success" => false, "message" => "Only GET requests are allowed."], 405);
}

$scores = read_scores();
usort($scores, function ($a, $b) {
    return ((int)$b["score"]) <=> ((int)$a["score"]);
});

$topScores = array_slice($scores, 0, 10);
send_json(["success" => true, "scores" => $topScores]);
?>
