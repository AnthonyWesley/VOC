import EventAttendanceSection from "./EventAttendanceSection";
import EventBasicInfo from "./EventBasicInfo";
import EventMembersList from "./EventMembersList";
import PreacherSection from "./PreacherSection";

type RemoveMemberInput = {
  memberId: string;
  eventId: string;
};

type RemoveMemberMutation = {
  mutate: (data: RemoveMemberInput) => void;
  isPending: boolean;
};

type EventInfoTabProps = {
  formValues: any;
  setFormValues: React.Dispatch<React.SetStateAction<any>>;
  eventId: string;
  removeMember: RemoveMemberMutation;
  readOnly?: boolean;
};

export default function EventInfoTab({
  formValues,
  setFormValues,
  eventId,
  removeMember,
  readOnly = false,
}: EventInfoTabProps) {
  console.log(formValues);

  return (
    <div className="space-y-6 pt-2">
      <PreacherSection
        preacher={formValues.preacher}
        setFormValues={setFormValues}
        readOnly={readOnly}
      />

      <EventBasicInfo formValues={formValues} setFormValues={setFormValues} readOnly={readOnly} />

      <div>
        <EventAttendanceSection
          formValues={formValues}
          setFormValues={setFormValues}
          readOnly={readOnly}
        />
        {formValues.id && formValues.type === "HOUSE_SERVICE" && (
          <EventMembersList
            members={formValues.members}
            eventId={eventId}
            removeMember={removeMember}
            readOnly={readOnly}
          />
        )}
      </div>
    </div>
  );
}
