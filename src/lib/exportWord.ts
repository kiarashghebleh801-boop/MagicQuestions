"use client";

import {
  AlignmentType,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
} from "docx";
import type { Question } from "./questions";

const A4_WIDTH_TWIPS = 11907;
const A4_HEIGHT_TWIPS = 16839;
const BODY_SIZE = 22; // 11 pt in half-points
const BODY_FONT = "Arial";

async function questionImage(question: Question): Promise<ImageRun | null> {
  if (!question.imageUrl) return null;

  try {
    const response = await fetch(question.imageUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const maxWidth = 650;
    const scale = Math.min(1, maxWidth / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    bitmap.close();

    return new ImageRun({
      data: new Uint8Array(await blob.arrayBuffer()),
      transformation: { width, height },
      type: blob.type.includes("jpeg") ? "jpg" : "png",
    });
  } catch {
    return null;
  }
}

export async function exportPaperToWord(questions: Question[]) {
  const children: Paragraph[] = [];

  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    const image = await questionImage(question);

    // Blank spacer paragraph before every question, matching the Y10H template.
    children.push(
      new Paragraph({
        spacing: { after: 0 },
        children: [new TextRun({ text: "", font: BODY_FONT, size: BODY_SIZE })],
      }),
    );

    children.push(
      new Paragraph({
        keepNext: true,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `Q${index + 1}.`,
            bold: true,
            font: BODY_FONT,
            size: BODY_SIZE,
          }),
        ],
      }),
    );

    if (image) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [image],
        }),
      );
    } else {
      // Development fallback until private question crops are connected.
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: question.summary,
              font: BODY_FONT,
              size: BODY_SIZE,
            }),
          ],
        }),
      );
      children.push(
        new Paragraph({
          spacing: { after: 240 },
          children: [
            new TextRun({
              text: `[Source: ${question.session} ${question.year}, ${question.paper}, Q${question.questionNumber} — ${question.marks} marks]`,
              italics: true,
              color: "777777",
              font: BODY_FONT,
              size: 18,
            }),
          ],
        }),
      );
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: BODY_FONT, size: BODY_SIZE },
          paragraph: { spacing: { line: 240 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: A4_WIDTH_TWIPS, height: A4_HEIGHT_TWIPS },
            margin: {
              top: 900,
              bottom: 900,
              left: 800,
              right: 800,
              header: 720,
              footer: 720,
            },
            pageNumbers: { start: 1 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "Y10H", font: BODY_FONT, size: BODY_SIZE })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: BODY_FONT,
                    size: BODY_SIZE,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "MagicQuestions-ExamWizard-Paper.docx";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
