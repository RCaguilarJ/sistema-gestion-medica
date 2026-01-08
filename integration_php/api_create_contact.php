<?php
// integration_php/api_create_contact.php
require_once __DIR__ . '/../asosiacionMexicanaDeDiabetes/includes/db.php';
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) { http_response_code(400); echo json_encode(['error'=>'JSON inválido']); exit; }

$nombre = $input['nombre'] ?? '';
$email = $input['email'] ?? '';
$mensaje = $input['mensaje'] ?? '';

if (!$nombre || !$email || !$mensaje) { http_response_code(422); echo json_encode(['error'=>'Faltan campos']); exit; }

try {
  if (!empty($db) && $db instanceof PDO) {
    $stmt = $db->prepare("INSERT INTO contactos (nombre, email, mensaje, created_at) VALUES (?, ?, ?, NOW())");
    $stmt->execute([$nombre, $email, $mensaje]);

    $nstmt = $db->prepare("INSERT INTO notifications (tipo, referencia_id, mensaje, target_role, is_read, created_at) VALUES ('contacto', NULL, ?, 'ADMIN', 0, NOW())");
    $nstmt->execute(["Nuevo mensaje de contacto de {$nombre}"]);

    echo json_encode(['success' => true]);
    exit;
  }

  if (!empty($conn)) {
    $ins = $conn->prepare("INSERT INTO contactos (nombre, email, mensaje, created_at) VALUES (?, ?, ?, NOW())");
    $ins->bind_param('sss', $nombre, $email, $mensaje);
    $ins->execute();
    $conn->query("INSERT INTO notifications (tipo, referencia_id, mensaje, target_role, is_read, created_at) VALUES ('contacto', NULL, '" . $conn->real_escape_string("Nuevo mensaje de contacto de {$nombre}") . "', 'ADMIN', 0, NOW())");
    echo json_encode(['success' => true]);
    exit;
  }

  throw new Exception('Conexión a DB no encontrada');
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}

