from pydantic_models import FactCheckResponse
import instructor
from openai import OpenAI
from tavily import TavilyClient
import os 
from dotenv import load_dotenv
load_dotenv() 
tkey = os.getenv("TAVILY_API")
okey = os.getenv("OPEN_AI_API")



def fact_check_statement(claim: str, search_results: list):
    prompt = f"""
    You are a fact-checking AI. Given the following claim and search results, determine its accuracy.

    **Claim:** "{claim}"

    **Search Results:**
    {search_results}

    **Instructions:**
    - Assign a factual accuracy score from 0 (completely false) to 10 (completely true).
    - Provide a concise explanation that includes in-text references like [1], [2] to support your reasoning.
    - Provide relevant background information to help understand the situation.
    - If you are unable to locate sufficient reliable sources to verify the statement, clearly acknowledge this and provide an explanation. If a claim is widely recognized as common knowledge, indicate this.

    **Output Format (JSON):**
    {{
        "score": <integer between 0-10>,
        "explanation": "<text with in-text references like [1], [2]>",
        "context": "<background information>",
    }}
    """
    client = instructor.from_openai(OpenAI(api_key=okey))
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[{"role": "system", "content": "You are an expert fact-checking assistant."},
                  {"role": "user", "content": prompt}],
        response_model=FactCheckResponse
    )

    return response

def get_relevant_links(text, client):
    return client.search(query = 
                         f"You are a fact-checking assistant. Provide links that relate to the following text: \n"
                         f"{text}", 
                         max_results=5)

def search(input):
    tavily_client = TavilyClient(api_key=tkey)
    rel_links=get_relevant_links(input, tavily_client)
    fact_check=fact_check_statement(input, rel_links['results'])
    ret = {'score':fact_check.score, 'explanation':fact_check.explanation, 'references':[]}
    for item in rel_links['results']:
        ret['references'].append(item['url'])
    return ret




