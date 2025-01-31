let btncalcularimc = document.querySelector("#btncalcularimc");

btncalcularimc.addEventListener('click', function() {
        var peso = parseFloat(document.getElementById('peso').value);
        var altura = parseFloat(document.getElementById('altura').value);
        if (!isNaN(peso) && !isNaN(altura) && peso > 0 && altura > 0) {
            var imc = peso / Math.pow(altura, 2);
            var resultadoIMC = document.getElementById('resultadoimc');
            document.querySelector("#resultadoimc").innerHTML = "Tu índice de masa corporal es: " + imc.toFixed(2);
        } else {
            var resultadoIMC = document.getElementById('resultadoimc');
            document.querySelector("#resultadoimc").innerHTML = "Por favor, ingresa valores válidos para peso y altura.";
        } 



});


function mostrar() {
    var elemento = document.getElementById('noesta');
    if (elemento.style.display === 'block') {
        elemento.style.display = 'none';
    } else {
        elemento.style.display = 'block';
    }
}


