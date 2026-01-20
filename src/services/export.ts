import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import type { Document } from '@/types';

export interface ExportOptions {
  format: 'markdown' | 'html' | 'text';
  includeTitle?: boolean;
  includeMetadata?: boolean;
}

// Convert markdown to HTML
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');

  // Ordered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Horizontal rule
  html = html.replace(/^---$/gim, '<hr>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return `<p>${html}</p>`;
}

// Generate HTML document
function generateHtmlDocument(doc: Document, options: ExportOptions): string {
  const { includeTitle = true, includeMetadata = false } = options;

  const date = new Date(doc.updatedAt).toLocaleDateString('ja-JP');
  const contentHtml = markdownToHtml(doc.content);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3 { color: #111; }
    h1 { font-size: 2em; margin-bottom: 0.5em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'SF Mono', Monaco, monospace;
    }
    pre {
      background: #f4f4f4;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }
    pre code { background: none; padding: 0; }
    blockquote {
      border-left: 4px solid #137fec;
      margin: 1em 0;
      padding-left: 1em;
      color: #666;
    }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 2em 0; }
    .metadata { color: #666; font-size: 0.9em; margin-bottom: 2em; }
    .tags { margin-top: 0.5em; }
    .tag {
      display: inline-block;
      background: #e3f2fd;
      color: #1976d2;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8em;
      margin-right: 4px;
    }
  </style>
</head>
<body>
  ${includeTitle ? `<h1>${doc.title}</h1>` : ''}
  ${includeMetadata ? `
  <div class="metadata">
    <div>最終更新: ${date}</div>
    ${doc.tags?.length ? `<div class="tags">${doc.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
  </div>` : ''}
  <article>
    ${contentHtml}
  </article>
</body>
</html>`;
}

// Export document to file and share
export async function exportDocument(
  doc: Document,
  options: ExportOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    let content: string;
    let filename: string;
    let mimeType: string;

    // Create safe filename (allow Japanese characters)
    const safeName = doc.title.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, '_') || 'document';

    switch (options.format) {
      case 'html':
        content = generateHtmlDocument(doc, options);
        filename = `${safeName}.html`;
        mimeType = 'text/html';
        break;
      case 'markdown':
        content = options.includeTitle ? `# ${doc.title}\n\n${doc.content}` : doc.content;
        filename = `${safeName}.md`;
        mimeType = 'text/markdown';
        break;
      case 'text':
      default:
        content = options.includeTitle ? `${doc.title}\n\n${doc.content}` : doc.content;
        filename = `${safeName}.txt`;
        mimeType = 'text/plain';
    }

    console.log('[Export] Starting export:', { format: options.format, filename });

    // Verify cache directory exists
    if (!FileSystem.cacheDirectory) {
      console.error('[Export] Cache directory not available');
      return { success: false, error: 'キャッシュディレクトリが利用できません' };
    }

    // Write to temp file
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    console.log('[Export] Writing file to:', fileUri);

    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    console.log('[Export] File written successfully');

    // Verify file was created
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      console.error('[Export] File was not created');
      return { success: false, error: 'ファイルの作成に失敗しました' };
    }

    console.log('[Export] File info:', fileInfo);

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    console.log('[Export] Sharing available:', isAvailable);

    if (!isAvailable) {
      return {
        success: false,
        error: '共有機能が利用できません。開発ビルドで試してください。',
      };
    }

    // Share the file
    console.log('[Export] Opening share dialog...');
    await Sharing.shareAsync(fileUri, {
      mimeType,
      dialogTitle: `${doc.title}をエクスポート`,
    });

    console.log('[Export] Share dialog completed');
    return { success: true };
  } catch (error) {
    console.error('[Export] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `エクスポートに失敗しました: ${errorMessage}`,
    };
  }
}

// Copy content to clipboard
export function getExportContent(doc: Document, options: ExportOptions): string {
  switch (options.format) {
    case 'html':
      return generateHtmlDocument(doc, options);
    case 'markdown':
      return options.includeTitle ? `# ${doc.title}\n\n${doc.content}` : doc.content;
    case 'text':
    default:
      return options.includeTitle ? `${doc.title}\n\n${doc.content}` : doc.content;
  }
}
