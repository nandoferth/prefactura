<?php

$conceptos = json_decode(file_get_contents('php://input'), true);
$renglon_5_6 = '';
foreach($conceptos as $concepto){
    $datos_concepto = implode(';', array_values($concepto));
    $renglon_concepto = "\ncto;{$datos_concepto}";
    $importe = number_format($concepto['importe']*0.16, 4, '.', '');
    $renglon_concepto_impuesto_retenido = "\nctoit;{$concepto['importe']};002;Tasa;0.160000;{$importe}";
    $renglon_5_6 = $renglon_5_6.$renglon_concepto.$renglon_concepto_impuesto_retenido;
    // Cantidad;Unidad;ClaveUnidad;ClaveProdServ;NoIdentificacion;Descripcion;ValorUnitario;Importe;Descuento;ObjetoImp
}
echo json_encode(array('renglon_5_6' => $renglon_5_6));