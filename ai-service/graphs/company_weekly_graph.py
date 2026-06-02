from langgraph.graph import (
    StateGraph,
    END
)

from agents.weekly.research_agent import (
    research_agent
)

from agents.weekly.trend_agent import (
    trend_agent
)

from agents.weekly.signal_agent import (
    signal_agent
)

from agents.weekly.writer_agent import (
    writer_agent
)


def build_weekly_graph(
    llm
):

    workflow = StateGraph(
        dict
    )

    workflow.add_node(
        "research",
        lambda state:
            research_agent(
                state,
                llm
            )
    )

    workflow.add_node(
        "trend",
        lambda state:
            trend_agent(
                state,
                llm
            )
    )

    workflow.add_node(
        "signal",
        lambda state:
            signal_agent(
                state,
                llm
            )
    )

    workflow.add_node(
        "writer",
        lambda state:
            writer_agent(
                state,
                llm
            )
    )

    workflow.set_entry_point(
        "research"
    )

    workflow.add_edge(
        "research",
        "trend"
    )

    workflow.add_edge(
        "trend",
        "signal"
    )

    workflow.add_edge(
        "signal",
        "writer"
    )

    workflow.add_edge(
        "writer",
        END
    )

    return workflow.compile()