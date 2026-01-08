<?php
// integration_php/api_get_notifications.php
require_once __DIR__ . '/../asosiacionMexicanaDeDiabetes/includes/db.php';
header('Content-Type: application/json; charset=utf-8');

$role = strtoupper(trim($_GET['role'] ?? ''));
if (!$role) { http_response_code(400); echo json_encode(['error' => 'role requerido']); exit; }

try {
  if (!empty($db) && $db instanceof PDO) {
    $stmt = $db->prepare("SELECT id, tipo, referencia_id, mensaje, target_role, is_read, created_at FROM notifications WHERE target_role = ? AND is_read = 0 ORDER BY created_at DESC");
    $stmt->execute([$role]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows);
    exit;
  }

  if (!empty($conn)) {
    $r = $conn->query("SELECT id, tipo, referencia_id, mensaje, target_role, is_read, created_at FROM notifications WHERE target_role = '" . $conn->real_escape_string($role) . "' AND is_read = 0 ORDER BY created_at DESC");
    $rows = [];
    while ($row = $r->fetch_assoc()) $rows[] = $row;
    echo json_encode($rows);
    exit;
  }

  throw new Exception('Conexión a DB no encontrada');
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}

