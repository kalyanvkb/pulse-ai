import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

from services.pulse_context_service import build_pulse_context

from agents.strategy.ceo_agent import run_ceo
from agents.strategy.cio_agent import run_cio
from agents.strategy.cto_agent import run_cto
from agents.strategy.skeptic_agent import run_skeptic
from agents.strategy.moderator_agent import summarize

from services.openai_service import get_llm

def run():

    llm = get_llm()

    context = build_pulse_context()

    conversation = ""

    for round_num in range(3):

        ceo = run_ceo(
            llm,
            context,
            conversation
        )

        conversation += f"\nCEO:\n{ceo}\n"

        cio = run_cio(
            llm,
            context,
            conversation
        )

        conversation += f"\nCIO:\n{cio}\n"

        cto = run_cto(
            llm,
            context,
            conversation
        )

        conversation += f"\nCTO:\n{cto}\n"

        skeptic = run_skeptic(
            llm,
            context,
            conversation
        )

        conversation += f"\nSKEPTIC:\n{skeptic}\n"

    final_report = summarize(llm, conversation)

    return {
        "conversation": conversation,
        "finalReport": final_report
    }



if __name__ == "__main__":
    run()