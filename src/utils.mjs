export const getEmailHtml = (author, email, mergeState, branches, mainBranch) => `
    <p> Hi ${author},</p>
    <p>
      This is a reminder that you are the last committer of the following branches. If the branches were
      created by you, please review them to see if they are still needed.
    </p>
    <p>
      If you are not the owner of the branch please contact the owner to see if it is still needed.
    </p>
    ${
      mergeState === "merged"
        ? `<p>The following branches have been merged into the <code>${mainBranch}</code> branch, please clean them up:</p>`
        : `<p>The following branches have not been merged into the <code>${mainBranch}</code> branch, please confirm if they are still under development:</p>`
    }
    <table style="border: 1px solid black; border-collapse: collapse; padding: 5px;">
      <thead>
        <tr>
          <th style="border: 1px solid black; border-collapse: collapse; padding: 5px">#</th>
          <th style="border: 1px solid black; border-collapse: collapse; padding: 5px">Name</th>
          <th style="border: 1px solid black; border-collapse: collapse; padding: 5px">Last Update</th>
          <th style="border: 1px solid black; border-collapse: collapse; padding: 5px">Jira</th>
          <th style="border: 1px solid black; border-collapse: collapse; padding: 5px">Merge State</th>
        </tr>
      </thead>
      <tbody>
        ${branches
          .map(
            (branch, idx) =>
              `<tr>
          <td style="border: 1px solid black; border-collapse: collapse; padding: 5px">${idx + 1}</td>
          <td style="border: 1px solid black; border-collapse: collapse; padding: 5px">${branch.prettyName}</td>
          <td style="border: 1px solid black; border-collapse: collapse; padding: 5px">${branch.prettyDate}</td>
          <td style="border: 1px solid black; border-collapse: collapse; padding: 5px">
            <a href="${branch.url}">${branch.url.split("/").pop()}</a>
          </td>
          <td style="border: 1px solid black; border-collapse: collapse; padding: 5px">${
            mergeState === "merged" ? "Merged" : "Unmerged"
          }</td>
        </tr>`
          )
          .join("\n")}
      </tbody>
    </table>
    <p>Thanks for your help! We appreciate it.</p>
    <p>Regards,</p>
    <p>Git Clean</p>`;

export const getTeamsAdaptiveCard = (author, email, mergeState, branches, mainBranch) => ({
  type: "message",
  attachments: [
    {
      contentType: "application/vnd.microsoft.card.adaptive",
      content: {
        type: "AdaptiveCard",
        body: [
          {
            type: "TextBlock",
            text: `<at>${author}</at> [${email}](mailto:${email})`,
          },
          {
            type: "TextBlock",
            text:
              mergeState === "merged"
                ? `The following branches have been merged into the \`${mainBranch}\` branch, please clean them up:`
                : `The following branches have not been merged into the \`${mainBranch}\` branch, please confirm if they are still under development:`,
          },
        ]
          .concat(
            ...branches.map((branch, idx) => [
              {
                type: "TextBlock",
                text: `**${idx + 1}. ${branch.prettyName}**`,
              },
              {
                type: "TextBlock",
                text: `${branch.prettyDate} / [${branch.url.split("/").pop()}](${branch.url}) / ${
                  mergeState === "merged" ? "Merged" : "Unmerged"
                }`,
              },
            ])
          )
          .concat([
            {
              type: "TextBlock",
              size: "small",
              text: "If the branches were created by you, please review them to see if they are still needed. If not, please contact the owner.",
            },
          ]),

        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        version: "1.2",
        msteams: {
          entities: [
            {
              type: "mention",
              text: `<at>${author}</at>`,
              mentioned: {
                id: email,
                name: author,
              },
            },
          ],
          width: "full",
        },
      },
    },
  ],
});
