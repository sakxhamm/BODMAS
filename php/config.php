<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

const SCORE_FILE = __DIR__ . "/../data/scores.json";
const MAX_SCORE = 500;
const MAX_NAME_LENGTH = 18;
const MAX_ENTRIES = 200;

function send_json(array $payload, int $statusCode = 200): void {
    http_response_code($statusCode);
    header("Content-Type: application/json");
    echo json_encode($payload);
    exit;
}

function sanitize_name(string $name): string {
    $trimmed = trim($name);
    $clean = preg_replace("/[^a-zA-Z0-9 _-]/", "", $trimmed);
    return substr($clean ?? "", 0, MAX_NAME_LENGTH);
}

function read_scores(): array {
    if (!file_exists(SCORE_FILE)) {
        return [];
    }
    $content = file_get_contents(SCORE_FILE);
    $decoded = json_decode($content ?: "[]", true);
    return is_array($decoded) ? $decoded : [];
}

function write_scores(array $scores): bool {
    $dir = dirname(SCORE_FILE);
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
    return file_put_contents(SCORE_FILE, json_encode($scores, JSON_PRETTY_PRINT)) !== false;
}
?>
