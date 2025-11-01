import io
import pandas as pd
from xhtml2pdf import pisa


def to_excel(tasks):
    df = pd.DataFrame(tasks)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Tasks')
    buf.seek(0)
    return buf.read()


def to_pdf(tasks):
    html = """
    <html><body>
    <h1>Task Report</h1>
    <table border='1' cellspacing='0' cellpadding='4'>
    <tr>{}</tr>
    {}
    </table>
    </body></html>
    """
    if not tasks:
        headers = ''
        rows = ''
    else:
        headers = ''.join(f'<th>{k}</th>' for k in tasks[0].keys())
        rows = '\n'.join('<tr>' + ''.join(f'<td>{row.get(k, "")}</td>' for k in tasks[0].keys()) + '</tr>' for row in tasks)
    html = html.format(headers, rows)
    buf = io.BytesIO()
    pisa.CreatePDF(io.StringIO(html), dest=buf)
    buf.seek(0)
    return buf.read()
