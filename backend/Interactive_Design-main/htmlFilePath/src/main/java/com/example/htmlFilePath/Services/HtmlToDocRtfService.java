package com.example.htmlFilePath.Services;

import com.spire.doc.Document;

import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import com.spire.doc.FileFormat;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;

@Service
public class HtmlToDocRtfService {

	public byte[] convertHtmlToDoc(InputStream htmlInputStream) throws Exception {

		Document document = new Document();
		document.loadFromStream(htmlInputStream, FileFormat.Html);

		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		document.saveToStream(outputStream, FileFormat.Doc);
		return outputStream.toByteArray();
	}

	public byte[] convertHtmlToRtf(InputStream htmlInputStream) throws Exception {
		String html = new String(htmlInputStream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);

		html = inlineAllCss(html);

		Document document = new Document();
		document.loadFromStream(new ByteArrayInputStream(html.getBytes()), FileFormat.Html);

		ByteArrayOutputStream docxStream = new ByteArrayOutputStream();
		document.saveToStream(docxStream, FileFormat.Docx);

		Document docxDoc = new Document();
		docxDoc.loadFromStream(new ByteArrayInputStream(docxStream.toByteArray()), FileFormat.Docx);

//        fixTableStructure(docxDoc);

		ByteArrayOutputStream rtfStream = new ByteArrayOutputStream();
		docxDoc.saveToStream(rtfStream, FileFormat.Rtf);

		return rtfStream.toByteArray();
	}

	private String inlineAllCss(String html) throws IOException {
		org.jsoup.nodes.Document doc = Jsoup.parse(html);
		doc.outputSettings().prettyPrint(false);

		doc.select("link[rel=stylesheet]").remove();

		String manualBootstrap = """
				<style>
				  .btn {
				    display: inline-block;
				    font-weight: 400;
				    text-align: center;
				    border: 1px solid transparent;
				    padding: 6px 12px;
				    font-size: 14px;
				    line-height: 1.5;
				    border-radius: 4px;
				    margin: 3px;
				    text-decoration: none;
				  }
				  .btn-success {
				    color: #fff;
				    background-color: #28a745;
				    border-color: #28a745;
				  }
				  .btn-danger {
				    color: #fff;
				    background-color: #dc3545;
				    border-color: #dc3545;
				  }
				  .btn-warning {
				    color: #212529;
				    background-color: #ffc107;
				    border-color: #ffc107;
				  }
				  .btn-info {
				    color: #fff;
				    background-color: #17a2b8;
				    border-color: #17a2b8;
				  }
				  .btn-light {
				    color: #212529;
				    background-color: #f8f9fa;
				    border-color: #f8f9fa;
				  }
				  .btn-dark {
				    color: #fff;
				    background-color: #343a40;
				    border-color: #343a40;
				  }
				</style>
				""";
		doc.head().append(manualBootstrap);

		applyInlineButtonStyles(doc);

		return doc.outerHtml();
	}

	private void applyInlineButtonStyles(org.jsoup.nodes.Document doc) {
		String baseStyle = "display:inline-block;font-weight:400;text-align:center;border:1px solid transparent;"
				+ "padding:6px 12px;font-size:14px;line-height:1.5;border-radius:4px;margin:3px;text-decoration:none;";

		for (org.jsoup.nodes.Element btn : doc.select(".btn")) {
			String style = baseStyle;
			if (btn.hasClass("btn-success"))
				style += "color:#fff;background-color:#28a745;border-color:#28a745;";
			else if (btn.hasClass("btn-danger"))
				style += "color:#fff;background-color:#dc3545;border-color:#dc3545;";
			else if (btn.hasClass("btn-warning"))
				style += "color:#212529;background-color:#ffc107;border-color:#ffc107;";
			else if (btn.hasClass("btn-info"))
				style += "color:#fff;background-color:#17a2b8;border-color:#17a2b8;";
			else if (btn.hasClass("btn-light"))
				style += "color:#212529;background-color:#f8f9fa;border-color:#f8f9fa;";
			else if (btn.hasClass("btn-dark"))
				style += "color:#fff;background-color:#343a40;border-color:#343a40;";
			else
				style += "background-color:#e0e0e0;color:#000;";

			String existing = btn.attr("style");
			btn.attr("style", existing.isEmpty() ? style : existing + ";" + style);
		}
	}

}



