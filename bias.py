# bias.py
from transformers import AutoTokenizer, TFAutoModelForSequenceClassification
from transformers import pipeline
import google.generativeai as genai

tokenizer = AutoTokenizer.from_pretrained("d4data/bias-detection-model")
model = TFAutoModelForSequenceClassification.from_pretrained("d4data/bias-detection-model")

classifier = pipeline('text-classification', model=model, tokenizer=tokenizer)

# API key
john = ""

def run(sentence):
    # Get bias classification result
    result = classifier(sentence)
    label = result[0].get('label')
    score = result[0].get('score')

    # Initialize the Gemini client
    genai.configure(api_key=john)
    client = genai.GenerativeModel("gemini-2.0-flash")
    
    # Generate the explanation
    prompt = f"""
    Sentence: {sentence}
    Verdict: {label}
    Score/Probability: {score}

    I need you to explain the reasoning behind the verdict and score/probability for the provided sentence. This is for a bias detection project. Please be pretty concise with only 4 bullets. Be specific. Do not mention grammar/syntax.
    Here is the specific format I want you to follow:
    Here is the breakdown (don't actually say bullet or the number, just *...):
    Bullet 1: *
    Bullet 2: *
    Bullet 3: *
    Bullet 4: *

    Make sure that each bullet point is only 5-10 words long.
    """
    
    response = client.generate_content(prompt)
    analysis_text = response.text

    # Return results as a dictionary that can be used by Flask
    return {
        "output": sentence[:50] + "..." if len(sentence) > 50 else sentence,
        "label": label,
        "score": float(score) * 100,  # Convert to percentage
        "analysis": analysis_text
    }