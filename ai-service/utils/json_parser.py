import json


def parse_llm_json(content: str):

    if not content:
        raise ValueError("Empty LLM response.")

    content = content.strip()

    if content.startswith("```json"):

        content = (
            content
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

    elif content.startswith("```"):

        content = (
            content
            .replace("```", "")
            .strip()
        )

    return json.loads(content)