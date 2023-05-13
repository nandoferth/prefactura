<?php

$json = file_get_contents('clientes.json');

$clientes = json_decode($json);

echo json_encode($clientes);
