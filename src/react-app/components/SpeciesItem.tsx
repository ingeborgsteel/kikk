import {Button} from "./ui/button.tsx";
import {X} from "lucide-react";
import {Label} from "./ui/label.tsx";
import {Select} from "./ui/select.tsx";
import {Input} from "./ui/input.tsx";
import {Textarea} from "./ui/textarea.tsx";
import {useState} from "react";
import {Species} from "../types/observation.ts";

interface SpeciesItemProps {
  species: Species,
  updateSpecies: (field: keyof Species, value: (string | number)) => void,
  removeSpecies: () => void
  key: number
}

const SpeciesItem = ({species, updateSpecies, removeSpecies, key}: SpeciesItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return <div
    className="bg-white dark:bg-forest rounded-md border-2 border-moss hover:bg-sand/50 dark:hover:bg-bark/50 transition-colors"
  >
    <div
      className="flex items-center justify-between p-sm cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-bark dark:text-sand truncate">
          {species.species.PrefferedPopularname}
        </div>
      </div>
      <div className="flex items-center gap-sm ml-sm shrink-0">
        <Button
          variant="accent"
          size={"icon"}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            removeSpecies();
          }}
          aria-label="Remove species"
          className="shrink-0"
        >
          <X size={20}/>
        </Button>
      </div>
    </div>

    {/* Expanded Details */}
    {isExpanded && (
      <div className="px-md pb-md space-y-sm border-t border-moss/30">
        <div className="pt-sm">
          <div className="text-sm text-slate italic">{species.species.ValidScientificName}</div>
        </div>

        <div className="grid grid-cols-2 gap-sm">
          <div>
            <Label htmlFor={`gender-${key}`} className="text-bark dark:text-sand text-xs">
              Kjønn
            </Label>
            <Select
              id={`gender-${key}`}
              value={species.gender}
              onChange={(e) => updateSpecies('gender', e.target.value)}
              className="mt-1"
            >
              <option value="unknown">Ukjent</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>
          </div>
          <div>
            <Label htmlFor={`count-${key}`} className="text-bark dark:text-sand text-xs">
              Antall
            </Label>
            <Input
              id={`count-${key}`}
              type="number"
              min="1"
              value={species.count}
              onChange={(e) => updateSpecies('count', parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-sm">
          <div>
            <Label htmlFor={`age-${key}`} className="text-bark dark:text-sand text-xs">
              Alder
            </Label>
            <Input
              id={`age-${key}`}
              type="text"
              placeholder="f.eks. voksen"
              value={species.age || ''}
              onChange={(e) => updateSpecies('age', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor={`method-${key}`} className="text-bark dark:text-sand text-xs">
              Metode
            </Label>
            <Input
              id={`method-${key}`}
              type="text"
              placeholder="f.eks. sett"
              value={species.method || ''}
              onChange={(e) => updateSpecies('method', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor={`activity-${key}`} className="text-bark dark:text-sand text-xs">
              Aktivitet
            </Label>
            <Input
              id={`activity-${key}`}
              type="text"
              placeholder="f.eks. flyr"
              value={species.activity || ''}
              onChange={(e) => updateSpecies('activity', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`species-comment-${key}`}
                 className="text-bark dark:text-sand text-xs">
            Notat
          </Label>
          <Textarea
            id={`species-comment-${key}`}
            placeholder="Notater om denne spesifikke observasjonen..."
            value={species.comment}
            onChange={(e) => updateSpecies('comment', e.target.value)}
            className="mt-1"
            rows={2}
          />
        </div>
      </div>
    )}
  </div>
}

export default SpeciesItem;