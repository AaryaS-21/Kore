from flask import Flask, jsonify, request
from flask_cors import CORS
import bias
from search_actions import search

app = Flask(__name__)
CORS(app)

@app.route('/process', methods=['POST'])
def process_data():
    data = request.json
    if 'text' in data:
        selected_text = data['text']
        # print(f"Received text from extension: {selected_text}")
        
        result = bias.run(selected_text)
        factCheck = search(selected_text)
        print(factCheck)
        print(f"res: {result}")
        
        response = {
            "output": result["output"],
            "score": result["score"],
            "label": result["label"],
            "analysis": result["analysis"],
            "factScore": factCheck['score'],
            "factExplanation": factCheck['explanation'],
            "references": factCheck['references']
        }
        
        return jsonify(response)
    else:
        return jsonify({"error": "No text provided"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)