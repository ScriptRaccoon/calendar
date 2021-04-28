import { dateString, getDayIndex, dayInMillis } from "./helper.js";
import { Event } from "./Event.js";

export class Calendar {
    constructor() {
        this.mode = "view";
        this.events = {};
        this.weekOffset = 0;
        this.readyToTrash = false;
        this.slotHeight = 30;
        this.dateOptions = { month: "2-digit", day: "2-digit", year: "numeric" };
        this.weekStart = null;
        this.weekEnd = null;
    }

    setup() {
        this.setupTimes();
        this.setupDays();
        this.calculateCurrentWeek();
        this.showWeek();
        this.loadEventsFromLocalStorage(true);
        this.setupControls();
    }

    setupTimes() {
        const header = $("<div></div>").addClass("columnHeader");
        const slots = $("<div></div>").addClass("slots");
        for (let hour = 0; hour < 24; hour++) {
            $("<div></div>")
                .attr("data-hour", hour)
                .addClass("time")
                .text(`${hour}:00 - ${hour + 1}:00`)
                .appendTo(slots);
        }
        $(".dayTime").append(header).append(slots);
    }

    setupDays() {
        const cal = this;
        $(".day").each(function () {
            const dayIndex = parseInt($(this).attr("data-dayIndex"));
            const name = $(this).attr("data-name");
            const header = $("<div></div>").addClass("columnHeader").text(name);
            const slots = $("<div></div>")
                .addClass("slots")
                .attr("data-dayIndex", dayIndex);
            $("<div></div>").addClass("dayDisplay").appendTo(header);
            for (let hour = 0; hour < 24; hour++) {
                $("<div></div>")
                    .attr("data-hour", hour)
                    .appendTo(slots)
                    .addClass("slot")
                    .attr("data-dayIndex", dayIndex)
                    .click(() => cal.clickSlot(hour, dayIndex))
                    .hover(
                        () => cal.hoverOver(hour),
                        () => cal.hoverOut()
                    );
            }
            $(this).append(header).append(slots);
        });
    }

    calculateCurrentWeek() {
        const now = new Date();
        const firstDay = now.getDate() - getDayIndex(now);
        this.weekStart = new Date(now.setDate(firstDay));
        this.weekEnd = new Date(now.setDate(firstDay + 6));
    }

    setupControls() {
        $("#nextWeekBtn").click(() => this.changeWeek(1));
        $("#prevWeekBtn").click(() => this.changeWeek(-1));
        $("#addButton").click(() => this.addNewEvent());
        $("#trashButton").click(() => this.trash());
        $("#cancelButton").click(() => this.closeModal());
        $(".color").click(this.changeColor);
    }

    changeWeek(number) {
        const offset = number * dayInMillis * 7;
        this.weekOffset += number;
        this.weekStart = new Date(this.weekStart.getTime() + offset);
        this.weekEnd = new Date(this.weekEnd.getTime() + offset);
        this.showWeek();
        this.loadEventsFromLocalStorage();
    }

    showWeek() {
        $("#weekStartDisplay").text(
            this.weekStart.toLocaleDateString(undefined, this.dateOptions)
        );
        $("#weekEndDisplay").text(
            this.weekEnd.toLocaleDateString(undefined, this.dateOptions)
        );

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const date = new Date(
                this.weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000
            );
            const day = date.getDate().toString().padStart(2, "0");
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            $(`.day[data-dayIndex=${dayIndex}] .dayDisplay`).text(`${day}.${month}`);
        }
        if (this.weekOffset == 0) {
            this.showCurrentDay();
        } else {
            this.hideCurrentDay();
        }
    }

    showCurrentDay() {
        const now = new Date();
        const dayIndex = getDayIndex(now);
        $(`.day[data-dayIndex=${dayIndex}]`).addClass("currentDay");
    }

    hideCurrentDay() {
        $(".day").removeClass("currentDay");
    }

    hoverOver(hour) {
        $(`.time[data-hour=${hour}]`).addClass("currentTime");
    }

    hoverOut() {
        $(".time").removeClass("currentTime");
    }

    clickSlot(hour, dayIndex) {
        if (this.mode != "view") return;
        this.mode = "create";
        const start = hour.toString().padStart(2, "0") + ":00";
        const end = ((hour + 1) % 24).toString().padStart(2, "0") + ":00";
        const date = dateString(
            new Date(this.weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000)
        );
        const event = new Event({
            start,
            end,
            date,
            title: "",
            description: "",
            color: "red",
        });
        this.openModal(event);
    }

    changeColor() {
        $(".color.active").removeClass("active");
        $(this).addClass("active");
    }

    openModal(event) {
        $("#modalTitle").text(
            this.mode == "edit" ? "Update your event" : "Create a new event"
        );
        $("#eventDate").val(event.date);
        $("#eventStart").val(event.start);
        $("#eventEnd").val(event.end);
        $("#eventTitle").val(event.title);
        $("#eventDescription").val(event.description);
        $(".color").removeClass("active");
        $(`.color[data-color=${event.color}]`).addClass("active");
        if (this.mode == "edit") {
            $("#submitButton").val("Update");
            $("#deleteButton")
                .show()
                .off("click")
                .click(() => event.delete(this));
            $("#copyButton")
                .show()
                .off("click")
                .click(() => event.copy(this));
        } else if (this.mode == "create") {
            $("#submitButton").val("Create");
            $("#deleteButton, #copyButton").hide();
        }
        $("#eventModal").fadeIn("fast");
        $("#eventTitle").focus();
        $("#calendar").addClass("opaque");
        $("#eventModal")
            .off("submit")
            .submit((e) => {
                e.preventDefault();
                this.submitModal(event);
            });
    }

    submitModal(event) {
        if (!event.isValid(this)) return;
        event.update(this);
        this.closeModal();
    }

    closeModal() {
        $("#eventModal").hide();
        $("#errors").text("");
        $("#calendar").removeClass("opaque");
        this.mode = "view";
    }

    addNewEvent() {
        if (this.mode != "view") return;
        this.mode = "create";
        const now = new Date();
        const event = new Event({
            start: "12:00",
            end: "13:00",
            date: dateString(now),
            title: "",
            description: "",
            color: "red",
        });
        this.openModal(event);
    }

    saveEventsToLocalStorage() {
        localStorage.setItem("events", JSON.stringify(this.events));
    }

    loadEventsFromLocalStorage(firstTime = false) {
        $(".event").remove();
        if (firstTime) {
            this.events = JSON.parse(localStorage.getItem("events"));
            if (this.events) {
                for (const date of Object.keys(this.events)) {
                    for (const id of Object.keys(this.events[date])) {
                        const event = new Event(this.events[date][id]);
                        this.events[date][id] = event;
                    }
                }
            }
        }
        if (this.events) {
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                const date = dateString(
                    new Date(this.weekStart.getTime() + dayIndex * dayInMillis)
                );
                if (this.events[date]) {
                    for (const event of Object.values(this.events[date])) {
                        event.show(this);
                    }
                }
            }
        } else {
            this.events = {};
        }
    }

    trash() {
        if (this.readyToTrash) {
            this.readyToTrash = false;
            this.events = {};
            this.saveEventsToLocalStorage();
            $(".event").remove();
        } else {
            this.readyToTrash = true;
            window.alert(
                "This will delete all the events in your calendar. " +
                    "This cannot be undone. If you are sure, click " +
                    "the trash can again in the next minute."
            );
            setTimeout(() => {
                this.readyToTrash = false;
            }, 60 * 1000);
        }
    }
}
