from prompts.daily.research_prompt import (
    RESEARCH_PROMPT
)

def research_agent(state, llm):

    article_blocks = []

    for article in state["articles"]:

        title = article.get(
            "title",
            "Untitled"
        )

        summary = article.get(
            "summary"
        )

        # Handle bad/missing summaries safely
        if isinstance(summary, list):

            summary_text = "\n".join(
                [
                    str(item)
                    for item in summary
                    if item
                ]
            )

        elif isinstance(summary, str):

            summary_text = summary

        else:

            summary_text = ""

        article_blocks.append(
            f"""
TITLE:
{title}

SUMMARY:
{summary_text}
"""
        )

    articles_text = "\n\n---\n\n".join(
        article_blocks
    )

    prompt = f"""
{RESEARCH_PROMPT}

ARTICLES:

{articles_text}
"""

    result = llm.invoke(
        prompt
    )

    state["facts"] = [
        line.strip()
        for line in result.content.split(
            "\n"
        )
        if line.strip()
    ]

    return state