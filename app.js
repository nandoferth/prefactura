let receptor = ''
let comprobante = ''
let conceptos = ''

const input_file_xlsx = document.getElementById('input_file_xlsx')

const boton_cargar_archivo_xlsx = document.getElementById('input_file_xlsx')
boton_cargar_archivo_xlsx.addEventListener('change', read_xlsx)

const input_file_pdf = document.getElementById('input_file_pdf')

const boton_cargar_archivo_pdf = document.getElementById('input_file_pdf')
boton_cargar_archivo_pdf.addEventListener('change', read_pdf)

let archivo_nombre_xlsx = document.getElementById('archivo-nombre-xlsx')
let archivo_nombre_pdf = document.getElementById('archivo-nombre-pdf')

let archivo_nombre = ''

let clientes_select = document.getElementById('clientes')
clientes_select.addEventListener('change', setCliente)

let obj_cliente = document.getElementById('obj_cliente')

let list_clientes = []

obtenerClientes()

async function read_xlsx() {
    try {
        let datos_conceptos = []
        let index_cocepto = 1
        await readXlsxFile(input_file_xlsx.files[0]).then(async function (rows) {
            archivo_nombre_xlsx.textContent = input_file_xlsx.files[0].name
            archivo_nombre = archivo_nombre_xlsx.textContent
            for(let concepto of rows){
                if(2<index_cocepto){
                    datos_conceptos.push({
                        'cantidad': 1,
                        'unidad': 'servicio',
                        'clave_unidad': 'E48',
                        'clave_prod_serv': '80101500',
                        'no_identificacion': '',
                        'descripcion': `${concepto[1]} ${concepto[2]} ${concepto[3]}`,
                        'valor_unitario': concepto[4],
                        'importe': concepto[4],
                        'descuento': '',
                        'objeto_imp': '02'
                    })
                }
                index_cocepto = index_cocepto + 1
            }
            const response = await fetch("server.php", {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify(datos_conceptos)
            })
            conceptos = await response.json()
        })
    } catch (error) {
        console.error(`Download error: ${error.message}`)
    }
}

async function read_pdf(){
    try {
        const blob = new Blob([input_file_pdf.files[0]], {type: 'application/pdf'})
        archivo_nombre_pdf.textContent = input_file_pdf.files[0].name
        archivo_nombre = input_file_pdf.files[0].name
        //
        // If absolute URL from the remote server is provided, configure the CORS
        // header on that server.
        //
        const url = URL.createObjectURL(blob)

        //
        // The workerSrc property shall be specified.
        //
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.js'

        //
        // Asynchronous download PDF
        //
        const loadingTask = pdfjsLib.getDocument(url)

        const pdf = await loadingTask.promise
        let page = null
        let lista_conceptos_pajina = []
        for(let pagina = 1; pagina <= pdf['_pdfInfo']['numPages']; pagina++){
            page = await pdf.getPage(pagina)
            const {conceptos_pajina, is_dejar_buscar_conceptos} = await page.getTextContent().then((textContent) => buscarConceptos(textContent))
            if(conceptos_pajina.length){
                lista_conceptos_pajina = lista_conceptos_pajina.concat(conceptos_pajina)
            }
            if(is_dejar_buscar_conceptos){
                break
            }
        }
        const response = await fetch("server.php", {
            headers: { "Content-Type": "application/json", },
            method: "POST",
            body: JSON.stringify(lista_conceptos_pajina)
        })
        conceptos = await response.json()
        console.log(conceptos)
    } catch (error) {
        console.log(error)
    }
}

function buscarConceptos(textContent) {
    let conceptos = []
    let contar_cabeceras = 0 // Va a contar las cabeceras de los artículos, en la página 2
    let is_habilitar_asignacion_concepto = false
    let concepto = []
    let is_dejar_buscar_conceptos = false
    const cabeceras = ['Nº','Descripción', 'Estado', 'Cantidad', 'Precio', 'Impuestos', 'Importe neto']
    for(let i = 0; i < textContent.items.length; i++) {
        if(textContent.items[i].str === '' || textContent.items[i].str === ' ') {
            continue
        } else if(textContent.items[i].str === cabeceras[contar_cabeceras]) {
            contar_cabeceras = contar_cabeceras + 1
        } else if(contar_cabeceras === 7){
            if (concepto.length == 8) {
                conceptos.push({
                    'cantidad': parseInt(concepto[4]),
                    'unidad': 'servicio',
                    'clave_unidad': 'E48',
                    'clave_prod_serv': '80101500',
                    'no_identificacion': '',
                    'descripcion': `${concepto[1]} ${concepto[2]} ${concepto[3]}`,
                    'valor_unitario': parseFloat(concepto[5].replace('.', '').replace(',', '.')),
                    'importe': parseFloat(concepto[7].replace('MXN ', '').replace('.', '').replace(',', '.')),
                    'descuento': '',
                    'objeto_imp': '02'
                })
                concepto = []
                is_habilitar_asignacion_concepto = false
            }
            if(is_habilitar_asignacion_concepto){
                if(8>concepto.length){
                    concepto.push(textContent.items[i].str)
                }
            } else{
                if(!isNaN(textContent.items[i].str) && textContent.items[i].str.length === 10){
                    is_habilitar_asignacion_concepto = true
                    concepto.push(textContent.items[i].str)
                }
            }
        } else if (textContent.items[i].str === 'Resumen del pedido') {
            is_dejar_buscar_conceptos = true
            break
        } else {
            continue
        }
    }
    return {'conceptos_pajina': conceptos, 'is_dejar_buscar_conceptos': is_dejar_buscar_conceptos}
}

async function obtenerClientes() {
    try{
        const response = await fetch('listarClientes.php',{
            headers: { 'Content-Type': 'application/json', },
            method: 'GET',
        })
       const {clientes} = await response.json()
       let index = 1
       for(let cliente of clientes){
            let cliente_opcion = document.createElement('option')
            cliente_opcion.text = cliente.nombre
            cliente_opcion.value = index
            clientes_select.add(cliente_opcion)
            index++
        }
        list_clientes = clientes
    } catch(error){
        console.error(`Download error: ${error.message}`)
    }
}

function setCliente(){
    if(0<clientes_select.value){
        const {rfc, nombre, domicilio_fiscal_receptor, residencia_fiscal, numr_reg_id_trib, regimen_fiscal_recepto, uso_CFDI, email} = list_clientes[clientes_select.value-1]
        receptor = `re;${rfc};${nombre};${domicilio_fiscal_receptor};${residencia_fiscal};${numr_reg_id_trib};${regimen_fiscal_recepto};${uso_CFDI};${email}`
        obj_cliente.textContent = receptor
        comprobante = '\nfa;FAC;MXN;;PPD;99;08 DIAS;06800;601;X 003;01'
    }
}

function descargar() {
    if (conceptos.hasOwnProperty('renglon_5_6') && receptor.length) {
        const link = document.createElement("a")
        const estructura = receptor + comprobante + conceptos.renglon_5_6 + '\nfafin'
        const file = new Blob([estructura], { type: 'text/plain' })
        link.href = URL.createObjectURL(file)
        link.download = `${archivo_nombre}.txt`
        link.click()
        URL.revokeObjectURL(link.href)
        conceptos = ''
        archivo_nombre = 'Ningún archivo elegido'
    }
}
$(function (){
    $(".crearNuevoCliente").load("formularioCrearNevoCliente.html")
})

$(document).ready(function () {
    action()
    $(".disabler").on("change", action)
})

function action() {

    var checked = $(".disabler").prop("checked")
    if (checked) {
        $(".showable").removeClass("hidden")
        $(".showable_pdf").addClass("hidden")
        $(".disabler_pdf").prop("checked", false)
    } else {
        $(".showable").addClass("hidden")
    }

}

$(document).ready(function () {
    action_pdf()
    $(".disabler_pdf").on("change", action_pdf)
})

function action_pdf() {

    var checked_pdf = $(".disabler_pdf").prop("checked")

    if (checked_pdf) {
        $(".showable_pdf").removeClass("hidden")
        $(".showable").addClass("hidden")
        $(".disabler").prop("checked", false)
    } else {
        $(".showable_pdf").addClass("hidden")
    }

}
