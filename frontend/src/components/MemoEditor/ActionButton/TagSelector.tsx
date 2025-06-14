import { Button } from "@usememos/mui";
import { HashIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import useClickAway from "react-use/lib/useClickAway";
import OverflowTip from "@/components/kit/OverflowTip";
import { userStore } from "@/store/v2";
import { useTranslate } from "@/utils/i18n";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/Popover";
import { EditorRefActions } from "../Editor";

interface Props {
  editorRef: React.RefObject<EditorRefActions>;
}

const TagSelector = observer((props: Props) => {
  const t = useTranslate();
  const { editorRef } = props;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tags = Object.entries(userStore.state.tagCount)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  useClickAway(containerRef, () => {
    setOpen(false);
  });

  const handleTagClick = (tag: string) => {
    const current = editorRef.current;
    if (current === null) return;

    const line = current.getLine(current.getCursorLineNumber());
    const lastCharOfLine = line.slice(-1);

    if (lastCharOfLine !== " " && lastCharOfLine !== "　" && line !== "") {
      current.insertText("\n");
    }
    current.insertText(`#${tag} `);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="plain" className="p-0">
          <HashIcon className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={2}>
        <div ref={containerRef}>
          {tags.length > 0 ? (
            <div className="flex flex-row justify-start items-start flex-wrap px-3 py-1 max-w-48 h-auto max-h-48 overflow-y-auto gap-x-2 gap-y-1">
              {tags.map((tag) => {
                return (
                  <div
                    key={tag}
                    className="inline-flex w-auto max-w-full cursor-pointer text-base leading-6 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-dark"
                    onClick={() => handleTagClick(tag)}
                  >
                    <OverflowTip>#{tag}</OverflowTip>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="italic mx-2" onClick={(e) => e.stopPropagation()}>
              {t("tag.no-tag-found")}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

export default TagSelector;
