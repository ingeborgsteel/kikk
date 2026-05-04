import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { Octokit } from "@octokit/core";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useAuth } from "../context/AuthContext";
import { Modal } from "./ui/Modal";

const GITHUB_OWNER = "ingeborgsteel";
const GITHUB_REPO = "kikk";

interface GitHubIssueFormProps {
  onClose: () => void;
  showForm: boolean;
}

export function GitHubIssueForm({ onClose, showForm }: GitHubIssueFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { userAccess } = useAuth();

  useEffect(() => {
    if (!showForm) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, showForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const githubToken =
        userAccess?.github_token ?? import.meta.env.VITE_GITHUB_TOKEN;

      console.log(githubToken);

      if (!githubToken) {
        setMessage("GitHub-token mangler. Kontakt administrator.");
        setLoading(false);
        return;
      }

      const octokit = new Octokit({
        auth: githubToken,
      });

      await octokit.request("POST /repos/{owner}/{repo}/issues", {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        title,
        body: description,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      setMessage("Issue opprettet! 🎉");
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setMessage("");
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error creating GitHub issue:", error);
      setMessage("Noe gikk galt. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Modal
        title="Forslag til forbedring"
        icon={<MessageSquare size={24} />}
        isOpen={showForm}
        onClose={onClose}
        footer={
          <div className="flex gap-md justify-end">
            <Button
              type="button"
              onClick={() => {
                onClose();
                setTitle("");
                setDescription("");
                setMessage("");
              }}
              variant="outline"
              size="sm"
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading} size="sm">
              {loading ? "Oppretter..." : "Opprett issue"}
            </Button>
          </div>
        }
      >
        <div className="space-y-lg">
          <div>
            <label
              htmlFor="issue-title"
              className="block text-sm font-semibold mb-2 text-bark dark:text-sand"
            >
              Tittel
            </label>
            <Input
              id="issue-title"
              type="text"
              placeholder="Beskriv forslaget kort..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="issue-description"
              className="block text-sm font-semibold mb-2 text-bark dark:text-sand"
            >
              Detaljer
            </label>
            <Textarea
              id="issue-description"
              placeholder="Beskriv forslaget i detalj..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
          </div>
          {message && (
            <div
              className={`p-md rounded-md ${message.includes("galt") ? "bg-rust/20 text-rust-dark" : "bg-moss/20 text-forest"}`}
            >
              {message}
            </div>
          )}
        </div>
      </Modal>
    </form>
  );
}
