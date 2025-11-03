import React, { useState } from 'react';
import { Button, Stack } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';

export default function ExportButtons() {
  const [busy, setBusy] = useState(false);

  const download = async (format) => {
    setBusy(true);
    try {
      const res = await axios.post(`/api/export?format=${format}`, {}, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'pdf' ? 'tasks.pdf' : 'tasks.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack direction="row" spacing={1}>
      <Button size="small" variant="outlined" startIcon={<DownloadIcon />} disabled={busy} onClick={() => download('excel')}>
        Export Excel
      </Button>
      <Button size="small" variant="outlined" startIcon={<DownloadIcon />} disabled={busy} onClick={() => download('pdf')}>
        Export PDF
      </Button>
    </Stack>
  );
}
