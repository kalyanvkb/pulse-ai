# LangGraph orchestration
from langgraph.graph import (
    StateGraph,
    END
)

from models.state import (
    CompanyBriefState
)

from agents.daily.research_agent import (
    research_agent
)

from agents.daily.theme_agent import (
    theme_agent
)

from agents.daily.impact_agent import (
    impact_agent
)

from agents.daily.writer_agent import (
    writer_agent
)


def build_graph(llm):

    graph = StateGraph(
        CompanyBriefState
    )

    graph.add_node(
        "research",
        lambda s: research_agent(
            s,
            llm
        )
    )

    graph.add_node(
        "themes",
        lambda s: theme_agent(
            s,
            llm
        )
    )

    graph.add_node(
        "impact",
        lambda s: impact_agent(
            s,
            llm
        )
    )

    graph.add_node(
        "writer",
        lambda s: writer_agent(
            s,
            llm
        )
    )

    graph.set_entry_point(
        "research"
    )

    graph.add_edge(
        "research",
        "themes"
    )

    graph.add_edge(
        "themes",
        "impact"
    )

    graph.add_edge(
        "impact",
        "writer"
    )

    graph.add_edge(
        "writer",
        END
    )

    return graph.compile()