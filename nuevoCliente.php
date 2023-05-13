<?php
try{
    $cliente = json_decode(file_get_contents('php://input'), true);
    
    $clientes = json_decode(file_get_contents('clientes.json'), true)['clientes'];
    
    array_push($clientes, $cliente);
    
    $json_clientes = json_encode(array('clientes' => $clientes), JSON_PRETTY_PRINT);
    $fp = fopen('clientes.json', 'w');
    fwrite($fp, $json_clientes);
    fclose($fp);
    
    echo json_encode(array('mensaje'=> 'Cliente creado.'));
}catch(Exception $e){
    echo json_encode(array('mensaje'=> 'Cliente no creado.'));
}