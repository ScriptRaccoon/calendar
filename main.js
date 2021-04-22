let mode = "view";
let currentEvent = null;

const dateOptions = { month: "2-digit", day: "2-digit", year: "numeric" };
let weekStart, weekEnd;

$(() => {
    setupCalendar();
    $(".slot").click(handleClick);
    $(".slot").hover(handleHover);
});

function setupCalendar() {
    $("#calendar > *").each(function () {
        const name = this.id;
        const isDay = $(this).hasClass("day");
        const header = $("<div></div>").addClass("columnHeader").text(name);
        const slots = $("<div></div>").addClass("slots");
        for (let hour = 0; hour < 24; hour++) {
            $("<div></div>")
                .addClass(isDay ? "slot" : "time")
                .attr("data-day", name)
                .attr("data-hour", hour)
                .text(isDay ? "" : hour + ":00 - " + (parseInt(hour) + 1) + ":00")
                .appendTo(slots);
        }
        $(this).append(header).append(slots);
        getCurrentWeek();
        showWeek();
    });
}

function handleHover() {
    const hour = $(this).attr("data-hour");
    $(".time").removeClass("currentTime");
    $(`.time[data-hour=${hour}]`).addClass("currentTime");
}

function handleClick() {
    if (mode != "view") return;
    const slot = $(this);
    mode = slot.hasClass("booked") ? "edit" : "create";
    const hour = slot.attr("data-hour");
    const day = slot.attr("data-day");
    currentEvent = { hour, day, slot };
    if (mode == "edit") {
        currentEvent.title = slot.attr("data-title");
        currentEvent.description = slot.attr("data-description");
        currentEvent.color = slot.attr("data-color");
    }
    openModal();
}

function openModal() {
    const modalTitle = mode == "edit" ? "Edit your event" : "Create a new event";
    $("#modalTitle").text(modalTitle);
    $("#eventDay").text(currentEvent.day);
    $("#eventHour").text(
        currentEvent.hour + ":00 - " + (parseInt(currentEvent.hour) + 1) + ":00"
    );
    if (mode == "edit") {
        $("#deleteButton").show();
        $("#eventTitle").val(currentEvent.title);
        $("#eventDescription").val(currentEvent.description);
        $(`.color[data-color=${currentEvent.color}]`).addClass("active");
    } else {
        $("#deleteButton").hide();
        $(".color").removeClass("active");
        $(".color[data-color=red]").addClass("active");
        $("#eventTitle").val("");
        $("#eventDescription").val("");
    }
    $("#eventModal").fadeIn("fast");
    $("#eventTitle").focus();
    $("#calendar").css("opacity", "0.3");
}

function closeModal() {
    $("#eventModal").hide();
    $("#errors").text("");
    mode = "view";
    $("#calendar").css("opacity", "1");
}

$("#cancelButton").click(closeModal);

$("#deleteButton").click(() => {
    currentEvent.slot
        .removeClass("booked")
        .text("")
        .removeAttr("data-color")
        .removeAttr("data-title")
        .removeAttr("data-description")
        .css("backgroundColor", "transparent");
    closeModal();
});

$("#eventModal").submit((e) => {
    e.preventDefault();
    currentEvent.title = $("#eventTitle").val();
    if (currentEvent.title == "") {
        $("#errors").text("There is no title");
        return;
    }
    currentEvent.description = $("#eventDescription").val();
    currentEvent.color = $(`.color.active`).attr("data-color");
    $("#eventTitle").val("");
    $("#eventDescription").val("");
    createEvent();
    closeModal();
});

function createEvent() {
    currentEvent.slot
        .addClass("booked")
        .text(currentEvent.title)
        .attr("data-title", currentEvent.title)
        .attr("data-description", currentEvent.description)
        .attr("data-color", currentEvent.color)
        .css(
            "backgroundColor",
            $(`.color[data-color=${currentEvent.color}]`).css("backgroundColor")
        );
}

$(".color").click(function () {
    $(".color.active").removeClass("active");
    $(this).addClass("active");
    currentEvent.color = $(this).attr("data-color");
});

$("#nextWeekBtn").click(() => {
    changeWeek(1);
});

$("#prevWeekBtn").click(() => {
    changeWeek(-1);
});

function changeWeek(number) {
    const offset = number * 1000 * 60 * 60 * 24 * 7;
    weekStart = new Date(weekStart.getTime() + offset);
    weekEnd = new Date(weekEnd.getTime() + offset);
    showWeek();
}

function getCurrentWeek() {
    const currentDate = new Date();
    const firstDay = currentDate.getDate() - currentDate.getDay() + 1;
    weekStart = new Date(currentDate.setDate(firstDay));
    weekEnd = new Date(currentDate.setDate(firstDay + 6));
}

function showWeek() {
    $("#weekStartDisplay").text(weekStart.toLocaleDateString(undefined, dateOptions));
    $("#weekEndDisplay").text(weekEnd.toLocaleDateString(undefined, dateOptions));
}
