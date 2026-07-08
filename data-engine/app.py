import io
from flask import Flask, jsonify, request
import pandas as pd

app = Flask(__name__)


@app.route("/inspecionar-csv", methods=["POST"])
def inspecionar_csv():
    """🔍 ROTA DE INSPEÇÃO: Inspeciona o arquivo e retorna os nomes de todas as colunas existentes."""
    if "file" not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado no campo 'file'"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "O arquivo enviado está vazio"}), 400

    try:
        conteudo_inicial = file.stream.read().decode("utf-8")
        df_header = pd.read_csv(io.StringIO(conteudo_inicial), nrows=0)
        
        colunas = df_header.columns.tolist()
        
        return jsonify({"colunas": colunas}), 200

    except Exception as e:
        return jsonify({"error": f"Erro ao extrair cabeçalhos do arquivo: {str(e)}"}), 500


@app.route("/processar-csv", methods=["POST"])
def processar_csv():
    if "file" not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado no campo 'file'"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "O arquivo enviado está vazio"}), 400

    # 🎛️ CAPTURA DE PARÂMETROS: Adicionamos o 'tipo_grafico' vindo do formulário
    coluna_x = request.form.get("eixo_x", "categoria")
    coluna_y = request.form.get("eixo_y", "valor")
    tipo_grafico = request.form.get("tipo_grafico", "bar")  # Fallback para gráfico de barras

    try:
        conteudo_arquivo = file.stream.read().decode("utf-8")
        df = pd.read_csv(io.StringIO(conteudo_arquivo))

        if coluna_x not in df.columns or coluna_y not in df.columns:
            return (
                jsonify(
                    {
                        "error": f"Colunas '{coluna_x}' ou '{coluna_y}' não encontradas no arquivo."
                    }
                ),
                400,
            )

        # Agrupamento clássico do Pandas
        df_agrupado = df.groupby(coluna_x)[coluna_y].sum().reset_index()

        labels = df_agrupado[coluna_x].tolist()
        valores = df_agrupado[coluna_y].tolist()

        # 📊 FORMATAÇÃO INTELIGENTE POR TIPO DE GRÁFICO
        # Se for pizza ou rosca, algumas engines preferem os valores em formato flat.
        # Deixamos a estrutura universal pronta para que o Front decida como plotar baseado no 'type'
        resposta_grafico = {
            "status": "success",
            "type": tipo_grafico,  # 'bar', 'line', 'pie' ou 'donut'
            "labels": labels,
            "datasets": [
                {
                    "label": f"Soma de {coluna_y.capitalize()} por {coluna_x.capitalize()}",
                    "data": valores,
                }
            ],
        }

        return jsonify(resposta_grafico), 200

    except Exception as e:
        return jsonify({"error": f"Erro interno ao processar dados: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)