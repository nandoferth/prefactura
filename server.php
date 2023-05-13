<?php

$conceptos = json_decode(file_get_contents('php://input'));
$renglon_5_6 = '';
for($i = 0; $i<count($conceptos); $i++){
    if($i<2){ continue; } // Ignorar las primeras 2 filas
    $renglon_concepto = "\ncto;{$conceptos[$i][7]};servicio;E48;80101500;;{$conceptos[$i][1]} {$conceptos[$i][2]} {$conceptos[$i][3]};{$conceptos[$i][4]};{$conceptos[$i][4]};;02";
    $importe = number_format($conceptos[$i][4]*0.160000, 2, '.', '');
    $renglon_concepto_impuesto_retenido = "\nctoit;{$conceptos[$i][4]};002;Tasa;0.160000;{$importe}";
    $renglon_5_6 = $renglon_5_6.$renglon_concepto.$renglon_concepto_impuesto_retenido;
    // Cantidad;Unidad;ClaveUnidad;ClaveProdServ;NoIdentificacion;Descripcion;ValorUnitario;Importe;Descuento;ObjetoImp
}
echo json_encode(array('renglon_5_6' => $renglon_5_6));