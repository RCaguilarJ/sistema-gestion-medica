<?php
// integration_php/api_create_cita.php
// Endpoint ejemplo para crear cita desde el frontend o desde la otra plataforma PHP.
// IMPORTANTE: Ajusta la conexión según tu `includes/db.php` real (PDO o mysqli).

require_once __DIR__ . '/../asosiacionMexicanaDeDiabetes/includes/db.php';
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
  http_response_code(400);
  echo json_encode(['error' => 'JSON inválido']);
  exit;
}

// Campos esperados (ajusta nombres según tu frontend):
// pacienteId, fechaHora, motivo, medicoId, notas, especialidad
$pacienteId = $input['pacienteId'] ?? null;
$fechaHora = $input['fechaHora'] ?? null;
$motivo = $input['motivo'] ?? '';
$medicoId = $input['medicoId'] ?? null;
$notas = $input['notas'] ?? '';
$especialidad = strtoupper(trim($input['especialidad'] ?? 'GENERAL'));

if (!$pacienteId || !$fechaHora) {
  http_response_code(422);
  echo json_encode(['error' => 'Faltan datos requeridos']);
  exit;
}

try {
  // Usamos PDO ($db) si está disponible. Ajusta si tu includes/db.php usa mysqli ($conn) u otro nombre.
  if (!empty($db) && $db instanceof PDO) {
    $stmt = $db->prepare("INSERT INTO citas (paciente_id, fecha_hora, motivo, medico_id, notas, especialidad, estado, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Pendiente', NOW())");
    $stmt->execute([$pacienteId, $fechaHora, $motivo, $medicoId, $notas, $especialidad]);
    $citaId = $db->lastInsertId();

    // Mapear especialidad -> rol objetivo
    $map = [
      'GENERAL' => 'DOCTOR',
      'ENDOCRINOLOGIA' => 'ENDOCRINOLOGO',
      'NUTRICION' => 'NUTRIOLOGO',
      'PODOLOGIA' => 'PODOLOGO',
      'PSICOLOGIA' => 'PSICOLOGO'
    ];
    $targetRole = $map[$especialidad] ?? 'DOCTOR';
    $mensaje = "Nueva cita (ID {$citaId}) para especialidad {$especialidad} - Fecha: {$fechaHora}";

    $nstmt = $db->prepare("INSERT INTO notifications (tipo, referencia_id, mensaje, target_role, is_read, created_at) VALUES ('cita', ?, ?, ?, 0, NOW())");
    $nstmt->execute([$citaId, $mensaje, $targetRole]);

    echo json_encode(['success' => true, 'citaId' => $citaId]);
    exit;
  }

  // Fallback para mysqli (si tu includes/db.php define $conn)
  if (!empty($conn)) {
    $sql = "INSERT INTO citas (paciente_id, fecha_hora, motivo, medico_id, notas, especialidad, estado, created_at) VALUES ('" . $conn->real_escape_string($pacienteId) . "', '" . $conn->real_escape_string($fechaHora) . "', '" . $conn->real_escape_string($motivo) . "', '" . $conn->real_escape_string($medicoId) . "', '" . $conn->real_escape_string($notas) . "', '" . $conn->real_escape_string($especialidad) . "', 'Pendiente', NOW())";
    if ($conn->query($sql) === TRUE) {
      $citaId = $conn->insert_id;
      $map = [
        'GENERAL' => 'DOCTOR',
        'ENDOCRINOLOGIA' => 'ENDOCRINOLOGO',
        'NUTRICION' => 'NUTRIOLOGO',
        'PODOLOGIA' => 'PODOLOGO',
        'PSICOLOGIA' => 'PSICOLOGO'
      ];
      $targetRole = $map[$especialidad] ?? 'DOCTOR';
      $mensaje = "Nueva cita (ID {$citaId}) para especialidad {$especialidad} - Fecha: {$fechaHora}";
      $ins = "INSERT INTO notifications (tipo, referencia_id, mensaje, target_role, is_read, created_at) VALUES ('cita', {$citaId}, '" . $conn->real_escape_string($mensaje) . "', '" . $conn->real_escape_string($targetRole) . "', 0, NOW())";
      $conn->query($ins);

      echo json_encode(['success' => true, 'citaId' => $citaId]);
      exit;
    } else {
      throw new Exception('Error al insertar cita: ' . $conn->error);
    }
  }

  throw new Exception('Conexión a base de datos no encontrada. Revisa includes/db.php');
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}

