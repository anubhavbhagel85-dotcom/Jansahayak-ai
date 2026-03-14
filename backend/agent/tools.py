from langchain.tools import tool
from schemes.vector_store import query_schemes

@tool
def scheme_search_tool(query: str) -> str:
    """Search welfare schemes matching the user profile.
    Input: e.g. farmer OBC UP age 45 income 80000
    Output: list of matching schemes with benefits
    """
    results = query_schemes(query)
    if not results:
        return 'No schemes found for this profile.'
    out = []
    for r in results:
        out.append(f"Scheme: {r.get('scheme_name', '')}")
        out.append(f"Benefit: {r.get('benefits', '')}")
        out.append(f"Apply: {r.get('portal_link', '')}")
        out.append('---')
    return chr(10).join(out)
