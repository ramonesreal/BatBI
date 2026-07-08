import io
from flask import Flask, jsonify, request
import pandas as pd

app = Flask(__name__)

# [SECURITY] Limit maximum upload size to 100MB to prevent memory exhaustion (DoS)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024


@app.route("/inspect-csv", methods=["POST"])
def inspect_csv():
    """🔍 INSPECTION ROUTE: Inspects the uploaded file and returns the names of all columns."""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded in the 'file' field"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "The uploaded file is empty"}), 400

    try:
        # [SECURITY/PERFORMANCE] Only read the first line (header) to avoid loading huge files into memory
        header_line = file.stream.readline().decode("utf-8", errors="replace")
        df_header = pd.read_csv(io.StringIO(header_line), nrows=0)
        
        columns = df_header.columns.tolist()
        
        return jsonify({"colunas": columns}), 200

    except Exception as e:
        return jsonify({"error": f"Error extracting file headers: {str(e)}"}), 500


@app.route("/process-csv", methods=["POST"])
def process_csv():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded in the 'file' field"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "The uploaded file is empty"}), 400

    # 🎛️ CAPTURE PARAMETERS: Read axis and chart options mapped from backend
    x_axis = request.form.get("xAxis", "category")
    y_axis = request.form.get("yAxis", "value")
    chart_type = request.form.get("chartType", "bar")  # Fallback to bar chart

    try:
        file_content = file.stream.read().decode("utf-8", errors="replace")
        df = pd.read_csv(io.StringIO(file_content))

        if x_axis not in df.columns or y_axis not in df.columns:
            return (
                jsonify(
                    {
                        "error": f"Columns '{x_axis}' or '{y_axis}' not found in the uploaded file."
                    }
                ),
                400,
            )

        # Standard Pandas aggregation
        df_grouped = df.groupby(x_axis)[y_axis].sum().reset_index()

        labels = df_grouped[x_axis].tolist()
        values = df_grouped[y_axis].tolist()

        # 📊 SMART FORMATTING BY CHART TYPE
        # Structure is ready for the frontend to render based on 'type'
        chart_response = {
            "status": "success",
            "type": chart_type,  # 'bar', 'line', 'pie', or 'donut'
            "labels": labels,
            "datasets": [
                {
                    "label": f"Sum of {y_axis.capitalize()} by {x_axis.capitalize()}",
                    "data": values,
                }
            ],
        }

        return jsonify(chart_response), 200

    except Exception as e:
        return jsonify({"error": f"Internal server error processing data: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)